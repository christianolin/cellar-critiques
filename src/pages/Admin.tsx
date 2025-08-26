import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import Layout from '@/components/Layout';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Region {
  id: string;
  name: string;
  country_id: string;
  countries?: { name: string };
}

interface Appellation {
  id: string;
  name: string;
  region_id: string;
  regions?: { name: string; countries?: { name: string } };
}

interface GrapeVariety {
  id: string;
  name: string;
  type: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'countries' | 'regions' | 'appellations' | 'grapes'>('countries');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellations] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  
  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'countries':
          const { data: countriesData, error: countriesError } = await supabase
            .from('countries')
            .select('*')
            .order('name');
          if (countriesError) throw countriesError;
          setCountries(countriesData || []);
          break;
          
        case 'regions':
          const { data: regionsData, error: regionsError } = await supabase
            .from('regions')
            .select('*, countries(name)')
            .order('name');
          if (regionsError) throw regionsError;
          setRegions(regionsData || []);
          // Also load countries for the dropdown
          const { data: allCountries } = await supabase.from('countries').select('*').order('name');
          setCountries(allCountries || []);
          break;
          
        case 'appellations':
          const { data: appellationsData, error: appellationsError } = await supabase
            .from('appellations')
            .select('*, regions(name, countries(name))')
            .order('name');
          if (appellationsError) throw appellationsError;
          setAppellations(appellationsData || []);
          // Also load regions for the dropdown
          const { data: allRegions } = await supabase
            .from('regions')
            .select('*, countries(name)')
            .order('name');
          setRegions(allRegions || []);
          break;
          
        case 'grapes':
          const { data: grapesData, error: grapesError } = await supabase
            .from('grape_varieties')
            .select('*')
            .order('name');
          if (grapesError) throw grapesError;
          setGrapeVarieties(grapesData || []);
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from(getTableName())
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from(getTableName())
          .update(formData)
          .eq('id', editingItem.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        // Create
        const { error } = await supabase
          .from(getTableName())
          .insert(formData);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Item created successfully",
        });
      }
      
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    }
  };

  const getTableName = () => {
    switch (activeTab) {
      case 'countries': return 'countries';
      case 'regions': return 'regions';
      case 'appellations': return 'appellations';
      case 'grapes': return 'grape_varieties';
      default: return 'countries';
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'countries':
        return (
          <>
            <div>
              <Label htmlFor="name">Country Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Country Code</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={2}
                required
              />
            </div>
          </>
        );
        
      case 'regions':
        return (
          <>
            <div>
              <Label htmlFor="name">Region Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="country_id">Country</Label>
              <Select
                value={formData.country_id || ''}
                onValueChange={(value) => setFormData({ ...formData, country_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case 'appellations':
        return (
          <>
            <div>
              <Label htmlFor="name">Appellation Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="region_id">Region</Label>
              <Select
                value={formData.region_id || ''}
                onValueChange={(value) => setFormData({ ...formData, region_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({region.countries?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case 'grapes':
        return (
          <>
            <div>
              <Label htmlFor="name">Grape Variety Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type || ''}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
    }
  };

  const renderTable = () => {
    let data: any[] = [];
    let headers: string[] = [];
    
    switch (activeTab) {
      case 'countries':
        data = countries;
        headers = ['Name', 'Code', 'Actions'];
        break;
      case 'regions':
        data = regions;
        headers = ['Name', 'Country', 'Actions'];
        break;
      case 'appellations':
        data = appellations;
        headers = ['Name', 'Region', 'Country', 'Actions'];
        break;
      case 'grapes':
        data = grapeVarieties;
        headers = ['Name', 'Type', 'Actions'];
        break;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {activeTab === 'countries' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                </>
              )}
              {activeTab === 'regions' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.countries?.name}</TableCell>
                </>
              )}
              {activeTab === 'appellations' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.regions?.name}</TableCell>
                  <TableCell>{item.regions?.countries?.name}</TableCell>
                </>
              )}
              {activeTab === 'grapes' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="capitalize">{item.type}</TableCell>
                </>
              )}
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 pb-20 md:pb-8">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Master Data Administration
          </h1>
        </div>

        <div className="flex gap-4 mb-6">
          {[
            { key: 'countries', label: 'Countries' },
            { key: 'regions', label: 'Regions' },
            { key: 'appellations', label: 'Appellations' },
            { key: 'grapes', label: 'Grape Varieties' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="capitalize">{activeTab}</CardTitle>
                <CardDescription>
                  Manage {activeTab} master data
                </CardDescription>
              </div>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab.slice(0, -1)}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              renderTable()
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the details below' : 'Fill in the details below'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderForm()}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}