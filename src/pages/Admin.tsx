import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings, Users, ChevronUp, ChevronDown } from 'lucide-react';
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

interface WineDatabase {
  id: string;
  name: string;
  wine_type: string;
  alcohol_content: number | null;
  description: string | null;
  producer_id: string;
  country_id: string;
  region_id: string | null;
  appellation_id: string | null;
  producers?: { name: string } | null;
  countries?: { name: string } | null;
  regions?: { name: string } | null;
  appellations?: { name: string } | null;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles?: {
    display_name?: string;
    username?: string;
  };
  user_roles?: {
    role: string;
  }[];
}

export default function Admin() {
  const { user } = useAuth();
  const { isOwner, isAdminOrOwner, loading: rolesLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState<'countries' | 'regions' | 'appellations' | 'grapes' | 'wine_database' | 'users'>('countries');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellations] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  const [wineDatabase, setWineDatabase] = useState<WineDatabase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [wineProducers, setWineProducers] = useState<{ id: string; name: string }[]>([]);
  
  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, sortField, sortDirection]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'countries':
          const { data: countriesData, error: countriesError } = await supabase
            .from('countries')
            .select('*')
            .order(sortField, { ascending: sortDirection === 'asc' });
          if (countriesError) throw countriesError;
          setCountries(countriesData || []);
          break;
          
        case 'regions':
          const { data: regionsData, error: regionsError } = await supabase
            .from('regions')
            .select('*, countries(name)')
            .order(sortField, { ascending: sortDirection === 'asc' });
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
            .order(sortField, { ascending: sortDirection === 'asc' });
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
            .order(sortField, { ascending: sortDirection === 'asc' });
          if (grapesError) throw grapesError;
          setGrapeVarieties(grapesData || []);
          break;
          
        case 'wine_database':
          const { data: wineDbData, error: wineDbError } = await supabase
            .from('wine_database')
            .select(`
              *,
              producers(name),
              countries(name),
              regions(name),
              appellations(name)
            `)
            .order(sortField, { ascending: sortDirection === 'asc' });
          if (wineDbError) throw wineDbError;
          setWineDatabase(wineDbData || []);
          
          // Also load producers and other data for dropdowns
          const [{ data: allProducers }, { data: allCountriesForWine }, { data: allRegionsForWine }] = await Promise.all([
            supabase.from('producers').select('*').order('name'),
            supabase.from('countries').select('*').order('name'),
            supabase.from('regions').select('*, countries(name)').order('name')
          ]);
          
          // Update state for dropdowns
          if (allProducers) setWineProducers(allProducers);
          if (allCountriesForWine) setCountries(allCountriesForWine);
          if (allRegionsForWine) setRegions(allRegionsForWine);
          break;
          
        case 'users':
          if (!isOwner) break; // Only owners can see users
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select(`
              user_id,
              username,
              display_name,
              created_at
            `)
            .order('created_at', { ascending: false });
          
          if (usersError) throw usersError;
          
          // Get user roles
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('user_id, role');
          
          const usersWithRoles = (usersData || []).map(profile => ({
            id: profile.user_id,
            email: '', // We can't access email from profiles
            created_at: profile.created_at,
            profiles: {
              display_name: profile.display_name,
              username: profile.username,
            },
            user_roles: rolesData?.filter(r => r.user_id === profile.user_id) || []
          }));
          
          setUsers(usersWithRoles);
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
      if (activeTab === 'users') {
        // Delete user role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', id)
          .eq('role', editingItem.role);
        if (error) throw error;
      } else {
        // Check for dependencies before deleting
        const dependencyCheck = await checkDependencies(id);
        if (!dependencyCheck.canDelete) {
          toast({
            title: "Cannot Delete",
            description: dependencyCheck.message,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from(getTableName())
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please check for related records.",
        variant: "destructive",
      });
    }
  };

  const checkDependencies = async (id: string): Promise<{ canDelete: boolean; message: string }> => {
    try {
      switch (activeTab) {
        case 'countries':
          // Check for regions and wines
          const { data: regionsInCountry } = await supabase
            .from('regions')
            .select('id, name')
            .eq('country_id', id);
          
          const { data: winesInCountry } = await supabase
            .from('wines')
            .select('id, name')
            .eq('country_id', id);

          if (regionsInCountry && regionsInCountry.length > 0) {
            const regionNames = regionsInCountry.slice(0, 3).map(r => r.name).join(', ');
            const extra = regionsInCountry.length > 3 ? ` and ${regionsInCountry.length - 3} more` : '';
            return {
              canDelete: false,
              message: `This country cannot be deleted because it has ${regionsInCountry.length} region(s): ${regionNames}${extra}. Delete the regions first.`
            };
          }

          if (winesInCountry && winesInCountry.length > 0) {
            return {
              canDelete: false,
              message: `This country cannot be deleted because it has ${winesInCountry.length} wine(s) associated with it. Remove or reassign the wines first.`
            };
          }

          return { canDelete: true, message: '' };

        case 'regions':
          // Check for appellations and wines
          const { data: appellationsInRegion } = await supabase
            .from('appellations')
            .select('id, name')
            .eq('region_id', id);
          
          const { data: winesInRegion } = await supabase
            .from('wines')
            .select('id, name')
            .eq('region_id', id);

          if (appellationsInRegion && appellationsInRegion.length > 0) {
            const appellationNames = appellationsInRegion.slice(0, 3).map(a => a.name).join(', ');
            const extra = appellationsInRegion.length > 3 ? ` and ${appellationsInRegion.length - 3} more` : '';
            return {
              canDelete: false,
              message: `This region cannot be deleted because it has ${appellationsInRegion.length} appellation(s): ${appellationNames}${extra}. Delete the appellations first.`
            };
          }

          if (winesInRegion && winesInRegion.length > 0) {
            return {
              canDelete: false,
              message: `This region cannot be deleted because it has ${winesInRegion.length} wine(s) associated with it. Remove or reassign the wines first.`
            };
          }

          return { canDelete: true, message: '' };

        case 'appellations':
          // Appellations can always be deleted as per user requirement
          return { canDelete: true, message: '' };

        case 'grapes':
          // Check for wine grape compositions
          const { data: wineGrapes } = await supabase
            .from('wine_grape_composition')
            .select('id')
            .eq('grape_variety_id', id);

          if (wineGrapes && wineGrapes.length > 0) {
            return {
              canDelete: false,
              message: `This grape variety cannot be deleted because it is used in ${wineGrapes.length} wine composition(s). Remove it from wines first.`
            };
          }

          return { canDelete: true, message: '' };

        case 'wine_database':
          // Check for wine cellar entries, ratings, and consumptions
          const [{ data: cellarEntries }, { data: ratings }, { data: consumptions }] = await Promise.all([
            supabase.from('wine_cellar').select('id').eq('wine_id', id),
            supabase.from('wine_ratings').select('id').eq('wine_id', id),
            supabase.from('wine_consumptions').select('id').eq('wine_id', id)
          ]);

          const totalReferences = (cellarEntries?.length || 0) + (ratings?.length || 0) + (consumptions?.length || 0);
          
          if (totalReferences > 0) {
            return {
              canDelete: false,
              message: `This wine cannot be deleted because it has ${totalReferences} reference(s) in cellar entries, ratings, or consumption records.`
            };
          }

          return { canDelete: true, message: '' };

        default:
          return { canDelete: true, message: '' };
      }
    } catch (error) {
      console.error('Error checking dependencies:', error);
      return {
        canDelete: false,
        message: 'Unable to verify dependencies. Please try again.'
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (activeTab === 'users' && formData.role) {
        // Handle user role changes
        if (editingItem) {
          // Remove old role if changing
          if (editingItem.role !== formData.role) {
            await supabase
              .from('user_roles')
              .delete()
              .eq('user_id', editingItem.id)
              .eq('role', editingItem.role);
          }
        }
        
        // Add new role
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: formData.user_id,
            role: formData.role
          });
        if (error) throw error;
      } else if (editingItem) {
        // Update other entities
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
      case 'wine_database': return 'wine_database';
      case 'users': return 'user_roles';
      default: return 'countries';
    }
  };

  const handleImportWineData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-wine-data');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Wine data import started successfully. This may take a few minutes.",
      });
      
      // Refresh the wine database data after a delay
      setTimeout(() => {
        loadData();
      }, 5000);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: `Failed to import wine data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // First, remove existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Then add the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole as "owner" | "admin" | "user"
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getSortField = (header: string): string => {
    switch (header.toLowerCase()) {
      case 'name': return 'name';
      case 'code': return 'code';
      case 'country': return 'country_id';
      case 'region': return 'region_id';
      case 'type': return 'type';
      case 'producer': return 'producer_id';
      case 'username': return 'username';
      case 'display name': return 'display_name';
      default: return 'name';
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
        
      case 'wine_database':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Wine Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="wine_type">Wine Type</Label>
                <Select
                  value={formData.wine_type || ''}
                  onValueChange={(value) => setFormData({ ...formData, wine_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wine type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Rosé">Rosé</SelectItem>
                    <SelectItem value="Sparkling">Sparkling</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
                    <SelectItem value="Fortified">Fortified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="producer_id">Producer</Label>
                <Select
                  value={formData.producer_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, producer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select producer" />
                  </SelectTrigger>
                  <SelectContent>
                    {wineProducers.map((producer) => (
                      <SelectItem key={producer.id} value={producer.id}>
                        {producer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alcohol_content">Alcohol Content (%)</Label>
                <Input
                  id="alcohol_content"
                  type="number"
                  step="0.1"
                  min="0"
                  max="25"
                  value={formData.alcohol_content || ''}
                  onChange={(e) => setFormData({ ...formData, alcohol_content: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
              <div>
                <Label htmlFor="region_id">Region (Optional)</Label>
                <Select
                  value={formData.region_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, region_id: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
      case 'wine_database':
        data = wineDatabase;
        headers = ['Name', 'Producer', 'Type', 'Country', 'Region', 'Actions'];
        break;
      case 'users':
        data = users;
        headers = ['Username', 'Display Name', 'Roles', 'Actions'];
        break;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead 
                key={header} 
                className={index < headers.length - 1 ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => {
                  if (index < headers.length - 1) { // Don't make Actions column sortable
                    const field = getSortField(header);
                    handleSort(field);
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {header}
                  {index < headers.length - 1 && getSortField(header) === sortField && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
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
              {activeTab === 'wine_database' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.producers?.name || ''}</TableCell>
                  <TableCell className="capitalize">{item.wine_type}</TableCell>
                  <TableCell>{item.countries?.name || ''}</TableCell>
                  <TableCell>{item.regions?.name || 'N/A'}</TableCell>
                </>
              )}
              {activeTab === 'users' && (
                <>
                  <TableCell>{item.profiles?.username || 'No username'}</TableCell>
                  <TableCell>{item.profiles?.display_name || 'No display name'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {item.user_roles?.map((ur: any) => (
                        <Badge key={ur.role} variant="secondary" className="capitalize">
                          {ur.role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </>
              )}
              <TableCell>
                <div className="flex gap-2">
                  {activeTab === 'users' ? (
                    isOwner && (
                      <Select
                        value={item.user_roles?.[0]?.role || 'user'}
                        onValueChange={(value) => updateUserRole(item.id, value)}
                        disabled={item.user_roles?.some((ur: any) => ur.role === 'owner')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    )
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (rolesLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <p>Checking permissions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdminOrOwner) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 pb-20 md:pb-8">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Administration Panel
          </h1>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          {[
            { key: 'countries', label: 'Countries' },
            { key: 'regions', label: 'Regions' },
            { key: 'appellations', label: 'Appellations' },
            { key: 'grapes', label: 'Grape Varieties' },
            { key: 'wine_database', label: 'Wine Database' },
            ...(isOwner ? [{ key: 'users', label: 'Users' }] : [])
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
                  {activeTab === 'users' ? 'Manage user roles and permissions' : `Manage ${activeTab} master data`}
                </CardDescription>
              </div>
              {activeTab !== 'users' && (
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {activeTab === 'countries' ? 'Country' : activeTab === 'regions' ? 'Region' : activeTab === 'appellations' ? 'Appellation' : activeTab === 'grapes' ? 'Grape Variety' : activeTab === 'wine_database' ? 'Wine' : 'Item'}
                </Button>
              )}
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
                {editingItem ? 'Edit' : 'Add'} {activeTab === 'countries' ? 'Country' : activeTab === 'regions' ? 'Region' : activeTab === 'appellations' ? 'Appellation' : activeTab === 'wine_database' ? 'Wine' : 'Grape Variety'}
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