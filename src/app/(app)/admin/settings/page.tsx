
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldAlert, Settings, AlertTriangle, CheckCircle, UserPlus, Type, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { SystemSettings } from '@/services/system-settings'; // Import the type
import { getSystemSettings, updateSystemSettings } from '@/services/system-settings'; // Import service functions

// Define the specific admin email address
const ADMIN_EMAIL = "admin@gmail.com";

// Debounce utility function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}


export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);

  // Local state for debounced input to avoid too many Firestore writes
  const [tempAppName, setTempAppName] = useState('');


  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push('/signin');
      return;
    }

    const checkAdminAccess = async () => {
      setCheckingRole(true);
      let userIsCurrentlyAdmin = false;
      if (user.email === ADMIN_EMAIL) {
        userIsCurrentlyAdmin = true;
      } else {
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
              userIsCurrentlyAdmin = true;
            }
          } catch (error) {
            console.error("Error fetching user role:", error);
            toast({ title: "Error", description: "Could not verify admin role.", variant: "destructive" });
          }
        }
      }

      if (userIsCurrentlyAdmin) {
        setIsAdmin(true);
      } else {
        toast({ title: "Access Denied", description: "You do not have permission.", variant: "destructive" });
        router.push('/');
      }
      setCheckingRole(false);
    };
    checkAdminAccess();
  }, [user, authLoading, router, toast]);


  useEffect(() => {
    if (isAdmin) {
      const fetchSettings = async () => {
        setLoadingSettings(true);
        setErrorSettings(null);
        try {
          const currentSettings = await getSystemSettings();
          setSettings(currentSettings);
          setTempAppName(currentSettings.applicationName); // Initialize tempAppName
        } catch (error) {
          console.error("Error fetching system settings:", error);
          setErrorSettings("Could not load system settings. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load system settings.",
            variant: "destructive",
          });
        } finally {
          setLoadingSettings(false);
        }
      };
      fetchSettings();
    }
  }, [isAdmin, toast]);

  const handleSettingUpdate = async (key: keyof SystemSettings, value: any, successMessage: string) => {
    if (!settings) return;

    const newSettings: Partial<SystemSettings> = { [key]: value };
    try {
      await updateSystemSettings(newSettings);
      setSettings(prev => prev ? { ...prev, [key]: value } : null); // Optimistic update
      toast({
        title: "Settings Updated",
        description: successMessage,
        variant: "default",
      });
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast({
        title: "Update Failed",
        description: `Could not update ${key}.`,
        variant: "destructive",
      });
      // Revert UI change on error by refetching
      const currentSettings = await getSystemSettings();
      setSettings(currentSettings);
      if (key === 'applicationName') {
        setTempAppName(currentSettings.applicationName);
      }
    }
  };

  const handleMaintenanceModeToggle = (checked: boolean) => {
    handleSettingUpdate('maintenanceMode', checked, `Maintenance mode ${checked ? 'enabled' : 'disabled'}.`);
  };

  const handleAllowNewUserRegistrationToggle = (checked: boolean) => {
    handleSettingUpdate('allowNewUserRegistration', checked, `New user registration ${checked ? 'enabled' : 'disabled'}.`);
  };
  
  const debouncedUpdateApplicationName = useCallback(
    debounce((newName: string) => {
      handleSettingUpdate('applicationName', newName, `Application name updated to "${newName}".`);
    }, 1000), // 1 second debounce
    [settings] // Recreate if settings (and thus handleSettingUpdate) changes identity
  );

  const handleTempApplicationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setTempAppName(newName);
    debouncedUpdateApplicationName(newName);
  };

  const handleDefaultItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      // Debounce or immediate update? For numbers, immediate might be fine, or also debounce.
      // For simplicity, using immediate update here.
      handleSettingUpdate('defaultItemsPerPage', value, `Default items per page set to ${value}.`);
    } else if (e.target.value === '') {
      // Allow clearing the input, but don't update Firestore with empty or invalid
      // Or handle validation more strictly
    }
  };


  if (authLoading || checkingRole || (isAdmin && loadingSettings)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" /> System Settings
            </CardTitle>
            <CardDescription>Loading settings...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (errorSettings) {
     return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" /> Error Loading Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{errorSettings}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
     )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" /> System Settings
          </CardTitle>
          <CardDescription>Configure system-wide settings for the application.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="maintenance-mode" className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, users will see a maintenance page. Only admins can access the site.
              </p>
            </div>
            {settings && (
              <Switch
                id="maintenance-mode"
                checked={settings.maintenanceMode}
                onCheckedChange={handleMaintenanceModeToggle}
                aria-label="Toggle maintenance mode"
              />
            )}
          </div>

          {/* Allow New User Registration */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="allow-registration" className="text-base font-medium flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Allow New User Registration
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Enable or disable the ability for new users to sign up.
              </p>
            </div>
            {settings && (
              <Switch
                id="allow-registration"
                checked={settings.allowNewUserRegistration}
                onCheckedChange={handleAllowNewUserRegistrationToggle}
                aria-label="Toggle new user registration"
              />
            )}
          </div>

          {/* Application Name */}
          <div className="rounded-lg border p-4 space-y-2">
            <Label htmlFor="application-name" className="text-base font-medium flex items-center gap-2">
              <Type className="h-5 w-5 text-green-500" />
              Application Name
            </Label>
            <p className="text-sm text-muted-foreground">
              This name will be displayed in various parts of the application, like the page title.
            </p>
            {settings && (
              <Input
                id="application-name"
                value={tempAppName}
                onChange={handleTempApplicationNameChange}
                placeholder="e.g., My Awesome ERP"
              />
            )}
          </div>

          {/* Default Items Per Page */}
          <div className="rounded-lg border p-4 space-y-2">
            <Label htmlFor="items-per-page" className="text-base font-medium flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-purple-500" />
              Default Items Per Page
            </Label>
            <p className="text-sm text-muted-foreground">
              Set the default number of items to display in paginated lists (e.g., user lists).
            </p>
            {settings && (
              <Input
                id="items-per-page"
                type="number"
                value={settings.defaultItemsPerPage}
                onChange={handleDefaultItemsPerPageChange}
                placeholder="e.g., 10"
                min="1"
              />
            )}
          </div>
        </CardContent>
        <CardFooter>
           <p className="text-xs text-muted-foreground">
            Settings last updated: {settings?.lastUpdated ? new Date(settings.lastUpdated.seconds * 1000).toLocaleString() : 'N/A'}
          </p>
        </CardFooter>
      </Card>

       {/* Placeholder for more settings categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings (Placeholder)</CardTitle>
          <CardDescription>Configure email and SMS notification preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Notification settings will be configurable here in a future update.
          </p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>API Integration (Placeholder)</CardTitle>
          <CardDescription>Manage API keys for third-party services.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            API key management will be available here.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

