import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface WineSearchResult {
  name: string;
  producer: string;
  vintage?: number;
  wine_type: string;
  country: string;
  region?: string;
  alcohol_content?: number;
}

interface WineSearchDialogProps {
  onWineSelect: (wine: WineSearchResult) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

// Predefined wine database for demonstration
const WINE_DATABASE: WineSearchResult[] = [
  { name: "Château Margaux", producer: "Château Margaux", vintage: 2019, wine_type: "red", country: "France", region: "Bordeaux", alcohol_content: 13.5 },
  { name: "Dom Pérignon", producer: "Dom Pérignon", vintage: 2012, wine_type: "sparkling", country: "France", region: "Champagne", alcohol_content: 12.5 },
  { name: "Opus One", producer: "Opus One Winery", vintage: 2018, wine_type: "red", country: "USA", region: "Napa Valley", alcohol_content: 14.5 },
  { name: "Caymus Cabernet Sauvignon", producer: "Caymus Vineyards", vintage: 2020, wine_type: "red", country: "USA", region: "Napa Valley", alcohol_content: 14.8 },
  { name: "Cloudy Bay Sauvignon Blanc", producer: "Cloudy Bay", vintage: 2021, wine_type: "white", country: "New Zealand", region: "Marlborough", alcohol_content: 13.0 },
  { name: "Penfolds Grange", producer: "Penfolds", vintage: 2017, wine_type: "red", country: "Australia", region: "Barossa Valley", alcohol_content: 14.5 },
  { name: "Chablis Premier Cru", producer: "Louis Michel", vintage: 2020, wine_type: "white", country: "France", region: "Burgundy", alcohol_content: 12.5 },
  { name: "Barolo Brunate", producer: "Giuseppe Rinaldi", vintage: 2018, wine_type: "red", country: "Italy", region: "Piedmont", alcohol_content: 14.0 },
  { name: "Riesling Kabinett", producer: "Dr. Loosen", vintage: 2021, wine_type: "white", country: "Germany", region: "Mosel", alcohol_content: 8.5 },
  { name: "Rioja Gran Reserva", producer: "La Rioja Alta", vintage: 2015, wine_type: "red", country: "Spain", region: "Rioja", alcohol_content: 14.0 },
  { name: "Silver Oak Cabernet", producer: "Silver Oak Cellars", vintage: 2018, wine_type: "red", country: "USA", region: "Napa Valley", alcohol_content: 14.4 },
  { name: "Sancerre", producer: "Henri Bourgeois", vintage: 2021, wine_type: "white", country: "France", region: "Loire Valley", alcohol_content: 13.0 },
  { name: "Amarone della Valpolicella", producer: "Allegrini", vintage: 2017, wine_type: "red", country: "Italy", region: "Veneto", alcohol_content: 15.5 },
  { name: "Château d'Yquem", producer: "Château d'Yquem", vintage: 2016, wine_type: "dessert", country: "France", region: "Bordeaux", alcohol_content: 14.0 },
  { name: "Pol Roger Champagne", producer: "Pol Roger", vintage: 2015, wine_type: "sparkling", country: "France", region: "Champagne", alcohol_content: 12.0 },
];

export default function WineSearchDialog({ onWineSelect, open: externalOpen, onOpenChange: externalOnOpenChange, trigger }: WineSearchDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [results, setResults] = useState<WineSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    setSearching(true);
    
    // Filter the wine database based on search criteria
    const filtered = WINE_DATABASE.filter(wine => {
      const matchesSearch = searchTerm === '' || 
        wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.region?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === '' || wine.wine_type === selectedType;
      const matchesCountry = selectedCountry === '' || wine.country === selectedCountry;
      
      return matchesSearch && matchesType && matchesCountry;
    });
    
    setTimeout(() => {
      setResults(filtered);
      setSearching(false);
      if (filtered.length === 0) {
        toast({
          title: "No results",
          description: "No wines found matching your criteria",
        });
      }
    }, 500);
  };

  const handleWineSelect = (wine: WineSearchResult) => {
    onWineSelect(wine);
    setOpen(false);
    setSearchTerm('');
    setSelectedType('');
    setSelectedCountry('');
    setResults([]);
  };

  const getWineTypeColor = (type: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      white: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      rose: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      sparkling: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      dessert: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      fortified: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search Wine Database
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wine Database Search</DialogTitle>
          <DialogDescription>
            Search our curated wine database to auto-fill wine information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Wine name, producer, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="type">Wine Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="rose">Rosé</SelectItem>
                  <SelectItem value="sparkling">Sparkling</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="fortified">Fortified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All countries</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Italy">Italy</SelectItem>
                  <SelectItem value="Spain">Spain</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="New Zealand">New Zealand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={searching} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {searching ? 'Searching...' : 'Search Wines'}
          </Button>

          {results.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Search Results ({results.length} wines found)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {results.map((wine, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleWineSelect(wine)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-base">{wine.name}</CardTitle>
                          <CardDescription>{wine.producer}</CardDescription>
                        </div>
                        <Badge className={getWineTypeColor(wine.wine_type)}>
                          {wine.wine_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vintage:</span>
                          <span>{wine.vintage || 'NV'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Country:</span>
                          <span>{wine.country}</span>
                        </div>
                        {wine.region && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Region:</span>
                            <span>{wine.region}</span>
                          </div>
                        )}
                        {wine.alcohol_content && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Alcohol:</span>
                            <span>{wine.alcohol_content}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <span>Can't find your wine? You can still enter it manually or use CellarTracker ID</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}