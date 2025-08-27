import { toast } from '@/hooks/use-toast';

interface CellarTrackerData {
  name?: string;
  producer?: string;
  vintage?: number;
  wine_type?: string;
  alcohol_content?: number;
  country?: string;
  region?: string;
  appellation?: string;
}

export class CellarTrackerService {
  static async fetchWineData(cellarTrackerId: string): Promise<CellarTrackerData | null> {
    if (!cellarTrackerId) {
      toast({
        title: "Error",
        description: "Please enter a CellarTracker ID",
        variant: "destructive",
      });
      return null;
    }

    try {
      // For now, we'll use a simulated API response since direct fetching has CORS issues
      // In a real implementation, you would need a backend service to fetch this data
      
      // Simulate fetching wine data based on common CellarTracker patterns
      const mockData: CellarTrackerData = {
        name: `Wine ${cellarTrackerId}`,
        producer: 'Unknown Producer',
        vintage: 2020,
        wine_type: 'red',
        alcohol_content: 13.5,
        country: 'France',
        region: 'Bordeaux',
      };

      // Return the mock data for now
      // TODO: Implement proper backend service to fetch real CellarTracker data
      toast({
        title: "Demo Mode",
        description: "This is demo data. Real CellarTracker integration requires backend service.",
      });

      return mockData;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data from CellarTracker. Please fill in manually.",
        variant: "destructive",
      });
      return null;
    }
  }

  // This method would be used with a proper backend service
  static async fetchWineDataFromBackend(cellarTrackerId: string): Promise<CellarTrackerData | null> {
    try {
      // This would call your backend API endpoint that fetches CellarTracker data
      const response = await fetch(`/api/cellartracker/${cellarTrackerId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from backend:', error);
      return null;
    }
  }
}