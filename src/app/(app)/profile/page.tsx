
'use client'; 

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense, useEffect, useState } from 'react'; 
import { useAuth } from '@/context/auth-context'; 
import { db } from '@/lib/firebase/client'; 
import type { StudentProfile } from '@/services/profile'; 
import { getStudentProfile } from '@/services/profile'; // Import the updated service
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Eye, UserSquare, BookOpen, FileText, FileImage } from 'lucide-react';

function ProfileDetailsLoader() {
  const { user, loading: authLoading } = useAuth(); 
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        if (!db) {
          setError("Database connection is not available.");
          setLoading(false);
          return;
        }
        try {
          const fetchedProfile = await getStudentProfile(user.uid); // Use the updated service
          setProfile(fetchedProfile);
        } catch (err) {
          console.error("Failed to fetch profile:", err);
          setError("Could not load profile data.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else if (!authLoading && !user) {
       setLoading(false);
       setError("Please sign in to view your profile.");
    }
  }, [user, authLoading]);


  if (loading || authLoading) {
     return (
        <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
        </div>
     );
  }

  if (error) {
     return <p className="text-center text-destructive">{error}</p>;
  }

   if (!profile) {
     return <p className="text-center text-muted-foreground">Profile not available.</p>;
   }

  const InfoItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="mb-2">
      <span className="font-semibold text-muted-foreground">{label}:</span>
      <span className="ml-2 text-foreground">{value || 'N/A'}</span>
    </div>
  );

  const DocumentItem = ({ label, url, isDownloadable = false }: { label: string; url?: string; isDownloadable?: boolean }) => (
    <div className="mb-3 flex items-center justify-between rounded-md border p-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {url && url !== '#' ? (
        isDownloadable ? (
          <Button variant="outline" size="sm" asChild>
            <a href={url} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" /> Download
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" /> View
            </a>
          </Button>
        )
      ) : (
        <span className="text-sm text-muted-foreground">Not Available</span>
      )}
    </div>
  );


  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <UserSquare className="mr-3 h-6 w-6 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-1 flex flex-col items-center">
            {profile.profilePhotoUrl && (
              <Image
                src={profile.profilePhotoUrl}
                alt="Profile Photo"
                width={150}
                height={150}
                className="rounded-full object-cover shadow-md mb-4"
                data-ai-hint="profile person"
              />
            )}
            <h3 className="text-lg font-semibold text-foreground">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div className="md:col-span-2 space-y-3">
            <InfoItem label="Full Name" value={profile.name} />
            <InfoItem label="Date of Birth" value={profile.dateOfBirth} />
            <InfoItem label="Gender" value={profile.gender} />
            <InfoItem label="Contact Number" value={profile.contactNumber} />
            <InfoItem label="Permanent Address" value={profile.permanentAddress} />
            <InfoItem label="Current Address" value={profile.currentAddress} />
            <InfoItem label="Blood Group" value={profile.bloodGroup} />
            <InfoItem label="Emergency Contact Name" value={profile.emergencyContactName} />
            <InfoItem label="Emergency Contact Number" value={profile.emergencyContactNumber} />
          </div>
        </CardContent>
      </Card>

      {/* Academic Details Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <BookOpen className="mr-3 h-6 w-6 text-primary" />
            Academic Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
          <InfoItem label="Enrollment Number / Roll Number" value={profile.enrollmentNumber} />
          <InfoItem label="Course / Program" value={profile.courseProgram} />
          <InfoItem label="Department" value={profile.department} />
          <InfoItem label="Current Year" value={profile.currentYear ? `Year ${profile.currentYear}` : 'N/A'} />
          <InfoItem label="Current Semester" value={profile.currentSemester ? `Semester ${profile.currentSemester}` : 'N/A'} />
          <InfoItem label="Academic Advisor" value={profile.academicAdvisorName} />
          <InfoItem label="Section / Batch" value={profile.sectionOrBatch} />
          <InfoItem label="Admission Date" value={profile.admissionDate} />
          <InfoItem label="Mode of Admission" value={profile.modeOfAdmission} />
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileText className="mr-3 h-6 w-6 text-primary" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DocumentItem label="ID Card" url={profile.idCardUrl} />
                <DocumentItem label="Admission Letter" url={profile.admissionLetterUrl} />
                <DocumentItem label="10th Mark Sheet" url={profile.marksheet10thUrl} />
                <DocumentItem label="12th Mark Sheet" url={profile.marksheet12thUrl} />
                <DocumentItem label="Migration Certificate" url={profile.migrationCertificateUrl} />
                <DocumentItem label="Bonafide Certificate" url={profile.bonafideCertificateUrl} isDownloadable={true} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <h4 className="mb-2 flex items-center text-md font-semibold text-foreground">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Uploaded Photo
                    </h4>
                    {profile.uploadedPhotoUrl ? (
                    <Image
                        src={profile.uploadedPhotoUrl}
                        alt="Uploaded Photo"
                        width={100}
                        height={100}
                        className="rounded-md border object-cover shadow-sm"
                        data-ai-hint="passport photo"
                    />
                    ) : <p className="text-sm text-muted-foreground">N/A</p>}
                </div>
                <div>
                    <h4 className="mb-2 flex items-center text-md font-semibold text-foreground">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Uploaded Signature
                    </h4>
                    {profile.uploadedSignatureUrl ? (
                    <Image
                        src={profile.uploadedSignatureUrl}
                        alt="Uploaded Signature"
                        width={200}
                        height={80}
                        className="rounded-md border bg-white object-contain p-1 shadow-sm" // bg-white for better signature visibility
                        data-ai-hint="signature"
                    />
                    ) : <p className="text-sm text-muted-foreground">N/A</p>}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          My Profile
        </h2>
        <Suspense fallback={
            <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-72 w-full rounded-lg" />
                <Skeleton className="h-80 w-full rounded-lg" />
            </div>
        }>
          <ProfileDetailsLoader />
        </Suspense>
      </div>
    </>
  );
}
