
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldAlert, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { SystemSettings } from '@/services/system-settings'; // Import the type
import { getSystemSettings, updateSystemSettings } from '@/services/system-settings'; // Import service functions


// Define the specific admin email address
const ADMIN_EMAIL = "admin@gmail.com";

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);


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

  const handleMaintenanceModeToggle = async (checked: boolean) => {
    if (!settings) return;

    const newSettings: Partial<SystemSettings> = { maintenanceMode: checked };
    try {
      await updateSystemSettings(newSettings);
      setSettings(prev => prev ? { ...prev, maintenanceMode: checked } : { maintenanceMode: checked });
      toast({
        title: "Settings Updated",
        description: `Maintenance mode ${checked ? 'enabled' : 'disabled'}.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      toast({
        title: "Update Failed",
        description: "Could not update maintenance mode.",
        variant: "destructive",
      });
      // Revert UI change on error
      setSettings(prev => prev ? { ...prev, maintenanceMode: !checked } : { maintenanceMode: !checked });
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
          <CardTitle>Application State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="maintenance-mode" className="text-base font-medium">
                Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
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
           {/* Example of another setting if needed */}
           {/*
           <div className="flex items-center justify-between rounded-lg border p-4">
             <div>
               <Label htmlFor="new-feature-toggle" className="text-base font-medium">
                 Enable New Feature X
               </Label>
               <p className="text-sm text-muted-foreground">
                 Toggle the availability of the new experimental feature X.
               </p>
             </div>
             <Switch
               id="new-feature-toggle"
               // checked={settings?.newFeatureXEnabled || false}
               // onCheckedChange={(checked) => handleSettingChange('newFeatureXEnabled', checked)}
             />
           </div>
           */}
        </CardContent>
        <CardFooter>
           <p className="text-xs text-muted-foreground">
            Last updated: {settings?.lastUpdated ? new Date(settings.lastUpdated.seconds * 1000).toLocaleString() : 'N/A'}
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
