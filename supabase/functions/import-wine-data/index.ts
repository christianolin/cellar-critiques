import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WineRow {
  country: string;
  description: string;
  designation: string;
  points: number;
  price: number | null;
  province: string;
  region_1: string;
  region_2: string | null;
  taster_name: string | null;
  taster_twitter_handle: string | null;
  title: string;
  variety: string;
  winery: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting wine data import...')

    // Download the CSV data directly from the GitHub gist
    const csvUrl = 'https://gist.github.com/clairehq/79acab35be50eaf1c383948ed3fd1129/raw/407a02139ae1e134992b90b4b2b8c329b3d73a6a/winemag-data-130k-v2.csv'
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    console.log('CSV data downloaded, processing...')

    // Parse CSV data
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')
    console.log('Headers:', headers)

    // Process in smaller batches to avoid timeout
    const batchSize = 100
    let processed = 0
    let inserted = 0

    // Process first 1000 wines only to avoid timeout
    for (let i = 1; i < Math.min(lines.length, 1001); i += batchSize) {
      const batch = []
      const endIndex = Math.min(i + batchSize, lines.length, 1001)

      for (let j = i; j < endIndex; j++) {
        if (!lines[j] || lines[j].trim() === '') continue

        try {
          // Parse CSV row - handle commas in quoted strings
          const row = parseCSVRow(lines[j])
          if (row.length < 13) continue // Skip incomplete rows

          const wine: WineRow = {
            country: cleanString(row[1]),
            description: cleanString(row[2]),
            designation: cleanString(row[3]),
            points: parseInt(row[4]) || 0,
            price: row[5] ? parseFloat(row[5]) : null,
            province: cleanString(row[6]),
            region_1: cleanString(row[7]),
            region_2: cleanString(row[8]) || null,
            taster_name: cleanString(row[9]) || null,
            taster_twitter_handle: cleanString(row[10]) || null,
            title: cleanString(row[11]),
            variety: cleanString(row[12]),
            winery: cleanString(row[13])
          }

          // Skip if missing essential data
          if (!wine.title || !wine.winery || !wine.country || !wine.variety) continue

          // Map wine type from variety
          const wineType = mapWineType(wine.variety)

          // Get or create country
          let { data: country } = await supabaseClient
            .from('countries')
            .select('id')
            .eq('name', wine.country)
            .single()

          if (!country) {
            const { data: newCountry } = await supabaseClient
              .from('countries')
              .insert([{ 
                name: wine.country, 
                code: getCountryCode(wine.country) 
              }])
              .select('id')
              .single()
            country = newCountry
          }

          // Get or create producer
          let { data: producer } = await supabaseClient
            .from('producers')
            .select('id')
            .eq('name', wine.winery)
            .single()

          if (!producer) {
            const { data: newProducer } = await supabaseClient
              .from('producers')
              .insert([{ 
                name: wine.winery,
                country_id: country?.id
              }])
              .select('id')
              .single()
            producer = newProducer
          }

          // Create wine database entry
          const wineData = {
            name: wine.title,
            wine_type: wineType,
            description: wine.description,
            alcohol_content: null, // Not available in this dataset
            producer_id: producer?.id,
            country_id: country?.id,
            region_id: null, // We'd need to create regions from province/region_1
            appellation_id: null
          }

          batch.push(wineData)
        } catch (error) {
          console.error(`Error processing row ${j}:`, error)
          continue
        }
      }

      if (batch.length > 0) {
        try {
          const { data, error } = await supabaseClient
            .from('wine_database')
            .insert(batch)

          if (error) {
            console.error('Batch insert error:', error)
          } else {
            inserted += batch.length
            console.log(`Inserted batch: ${batch.length} wines, Total: ${inserted}`)
          }
        } catch (error) {
          console.error('Batch insert failed:', error)
        }
      }

      processed += (endIndex - i)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processed} rows, inserted ${inserted} wines` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function parseCSVRow(row: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    const nextChar = row[i + 1]
    
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = false
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

function cleanString(str: string): string {
  if (!str) return ''
  return str.replace(/^"|"$/g, '').trim()
}

function mapWineType(variety: string): string {
  const lowerVariety = variety.toLowerCase()
  
  if (lowerVariety.includes('red') || 
      lowerVariety.includes('malbec') ||
      lowerVariety.includes('cabernet') ||
      lowerVariety.includes('merlot') ||
      lowerVariety.includes('pinot noir') ||
      lowerVariety.includes('tempranillo') ||
      lowerVariety.includes('sangiovese') ||
      lowerVariety.includes('syrah') ||
      lowerVariety.includes('shiraz') ||
      lowerVariety.includes('nebbiolo') ||
      lowerVariety.includes('grenache') ||
      lowerVariety.includes('primitivo') ||
      lowerVariety.includes('nero d\'avola')) {
    return 'Red'
  }
  
  if (lowerVariety.includes('white') ||
      lowerVariety.includes('chardonnay') ||
      lowerVariety.includes('sauvignon blanc') ||
      lowerVariety.includes('riesling') ||
      lowerVariety.includes('pinot gris') ||
      lowerVariety.includes('pinot grigio') ||
      lowerVariety.includes('gewürztraminer') ||
      lowerVariety.includes('chenin blanc') ||
      lowerVariety.includes('viognier') ||
      lowerVariety.includes('albariño') ||
      lowerVariety.includes('grillo') ||
      lowerVariety.includes('catarratto')) {
    return 'White'  
  }
  
  if (lowerVariety.includes('rosé') || lowerVariety.includes('rose')) {
    return 'Rosé'
  }
  
  if (lowerVariety.includes('sparkling') || 
      lowerVariety.includes('champagne') ||
      lowerVariety.includes('prosecco') ||
      lowerVariety.includes('cava')) {
    return 'Sparkling'
  }
  
  if (lowerVariety.includes('port') ||
      lowerVariety.includes('sherry') ||
      lowerVariety.includes('madeira') ||
      lowerVariety.includes('dessert')) {
    return 'Dessert'
  }
  
  return 'Red' // Default fallback
}

function getCountryCode(countryName: string): string {
  const codes: { [key: string]: string } = {
    'US': 'US',
    'United States': 'US',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Portugal': 'PT',
    'Germany': 'DE',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Australia': 'AU',
    'South Africa': 'ZA',
    'New Zealand': 'NZ',
    'Canada': 'CA',
    'Austria': 'AT',
    'Greece': 'GR',
    'Israel': 'IL',
    'Hungary': 'HU',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Slovenia': 'SI',
    'Croatia': 'HR',
    'Turkey': 'TR',
    'Georgia': 'GE',
    'Lebanon': 'LB',
    'Morocco': 'MA',
    'Uruguay': 'UY',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'India': 'IN',
    'China': 'CN',
    'Japan': 'JP',
    'Moldova': 'MD',
    'Macedonia': 'MK',
    'Serbia': 'RS',
    'Montenegro': 'ME',
    'Bosnia and Herzegovina': 'BA',
    'Ukraine': 'UA',
    'Cyprus': 'CY',
    'Czech Republic': 'CZ',
    'Slovakia': 'SK',
    'Switzerland': 'CH',
    'Luxembourg': 'LU',
    'England': 'GB',
    'Other': 'XX'
  }
  
  return codes[countryName] || 'XX'
}