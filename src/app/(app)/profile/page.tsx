
'use client'; 

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, Suspense } from 'react'; 
import { useAuth } from '@/context/auth-context'; 
import { db } from '@/lib/firebase/client'; 
import type { StudentProfile } from '@/services/profile'; 
import { getStudentProfile } from '@/services/profile';
import { createProfileChangeRequest } from '@/services/profile-change-requests';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, UserSquare, BookOpen, FileText, FileImage, ClipboardList, Edit3, UploadCloud, Send, Edit2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

function ProfileDetailsLoader() {
  const { user, loading: authLoading } = useAuth(); 
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editableProfile, setEditableProfile] = useState<Partial<StudentProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFieldInfo, setRequestFieldInfo] = useState<{ key: keyof StudentProfile; label: string } | null>(null);
  const [requestOldValue, setRequestOldValue] = useState('');
  const [requestNewValue, setRequestNewValue] = useState('');
  

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
          const fetchedProfile = await getStudentProfile(user.uid);
          setProfile(fetchedProfile);
          if (fetchedProfile) {
            setEditableProfile(fetchedProfile);
          }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['currentYear', 'currentSemester'];
    setEditableProfile(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === '' ? undefined : Number(value)) : value
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;
    toast({ title: "Saving Profile (Placeholder)", description: "Profile save functionality for non-critical fields will be implemented later." });
    // In a future step, this will save editableProfile to Firestore for non-critical fields
    // For now, just exit edit mode.
    setIsEditMode(false);
  };
  
  const openRequestModal = (fieldName: keyof StudentProfile, label: string) => {
    if (!profile) return;
    setRequestFieldInfo({ key: fieldName, label });
    setRequestOldValue(String(profile[fieldName] ?? 'N/A'));
    setRequestNewValue(String(profile[fieldName] ?? '')); 
    setIsRequestModalOpen(true);
  };

  const handleSubmitChangeRequest = async () => {
    if (!user || !profile || !requestFieldInfo) return;

    toast({ title: "Submitting Request...", description: `Requesting to change ${requestFieldInfo.label}.`});
    try {
        await createProfileChangeRequest(
            user.uid,
            profile.name, // Pass current profile name
            profile.email, // Pass current profile email
            requestFieldInfo.key, 
            requestOldValue, 
            requestNewValue
        );
        toast({ title: "Request Submitted", description: `Your request to change ${requestFieldInfo.label} has been submitted for admin approval.` });
    } catch (error) {
        console.error("Error submitting change request:", error)
        toast({ title: "Submission Failed", description: "Could not submit your change request. Please try again.", variant: "destructive" });
    }
    setIsRequestModalOpen(false);
    setRequestNewValue(''); 
    setRequestFieldInfo(null);
  };


  if (loading || authLoading) {
     return (
        <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-72 w-full rounded-lg" /> 
        </div>
     );
  }

  if (error) {
     return <p className="text-center text-destructive">{error}</p>;
  }

   if (!profile) {
     return <p className="text-center text-muted-foreground">Profile not available.</p>;
   }

  const InfoItem = ({ label, value, fieldName, isEditable, onEditRequest }: { label: string; value?: string | number | null; fieldName: keyof StudentProfile; isEditable?: boolean; onEditRequest?: (fieldName: keyof StudentProfile, label: string) => void }) => (
    <div className="mb-2">
      <Label htmlFor={fieldName} className="font-semibold text-muted-foreground">{label}:</Label>
      {isEditMode && isEditable ? (
        <Input
          id={fieldName}
          name={fieldName}
          className="mt-1"
          value={editableProfile[fieldName] as string || ''}
          onChange={handleInputChange}
          type={typeof profile[fieldName] === 'number' ? 'number' : 'text'}
        />
      ) : isEditMode && onEditRequest ? (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-foreground">{value || 'N/A'}</span>
          <Button variant="outline" size="sm" onClick={() => onEditRequest(fieldName, label)}>
            <Send className="mr-2 h-3 w-3" /> Request Change
          </Button>
        </div>
      ) : (
        <span className="ml-2 text-foreground">{value || 'N/A'}</span>
      )}
    </div>
  );
  
  const DocumentOrActionItem = ({ label, url, fieldName, actionLabel, icon, isDownloadable = false, actionType = 'link', uploadable = false }: { label: string; url?: string; fieldName?: keyof StudentProfile; actionLabel?: string; icon?: React.ElementType, isDownloadable?: boolean, actionType?: 'link' | 'button', uploadable?: boolean }) => {
    const IconComponent = icon;
    return (
        <div className="mb-3 flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center">
            {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && uploadable && (
                <Button variant="outline" size="sm" onClick={() => toast({title: "Upload (Placeholder)", description: `Upload for ${label} not implemented yet.`})}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload New
                </Button>
            )}
            {url && url !== '#' ? (
                <Button variant="outline" size="sm" asChild>
                <a href={url} download={isDownloadable} target="_blank" rel="noopener noreferrer">
                    {isDownloadable ? <Download className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />} {actionLabel || (isDownloadable ? 'Download' : 'View')}
                </a>
                </Button>
            ) : actionType === 'button' && actionLabel ? (
                <Button variant="outline" size="sm">
                {IconComponent && <IconComponent className="mr-2 h-4 w-4" />} {actionLabel}
                </Button>
            ): (
                !isEditMode && <span className="text-sm text-muted-foreground">{actionLabel || 'Not Available'}</span>
            )}
          </div>
        </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Edit Profile Button */}
      <div className="flex justify-end">
        {isEditMode ? (
            <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" /> Save Changes (Placeholder)
            </Button>
        ) : (
            <Button onClick={() => setIsEditMode(true)}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
        )}
      </div>


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
                src={isEditMode && typeof editableProfile.profilePhotoUrl === 'string' ? editableProfile.profilePhotoUrl : profile.profilePhotoUrl}
                alt="Profile Photo"
                width={150}
                height={150}
                className="rounded-full object-cover shadow-md mb-4"
                data-ai-hint="profile person"
              />
            )}
            {isEditMode && (
                <Button variant="outline" size="sm" className="mb-2" onClick={() => toast({title: "Upload (Placeholder)", description:"Upload for Profile Photo not implemented."})}>
                    <UploadCloud className="mr-2 h-4 w-4"/> Change Photo
                </Button>
            )}
            <h3 className="text-lg font-semibold text-foreground">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div className="md:col-span-2 space-y-3">
            <InfoItem label="Full Name" value={profile.name} fieldName="name" onEditRequest={openRequestModal}/>
            <InfoItem label="Date of Birth" value={profile.dateOfBirth} fieldName="dateOfBirth" isEditable={true} />
            <InfoItem label="Gender" value={profile.gender} fieldName="gender" isEditable={true} />
            <InfoItem label="Contact Number" value={profile.contactNumber} fieldName="contactNumber" isEditable={true} />
            <InfoItem label="Email Address" value={profile.email} fieldName="email" onEditRequest={openRequestModal} />
            <InfoItem label="Permanent Address" value={profile.permanentAddress} fieldName="permanentAddress" isEditable={true} />
            <InfoItem label="Current Address" value={profile.currentAddress} fieldName="currentAddress" isEditable={true} />
            <InfoItem label="Blood Group" value={profile.bloodGroup} fieldName="bloodGroup" isEditable={true} />
            <InfoItem label="Emergency Contact Name" value={profile.emergencyContactName} fieldName="emergencyContactName" isEditable={true} />
            <InfoItem label="Emergency Contact Number" value={profile.emergencyContactNumber} fieldName="emergencyContactNumber" isEditable={true} />
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
          <InfoItem label="Enrollment Number / Roll Number" value={profile.enrollmentNumber} fieldName="enrollmentNumber" onEditRequest={openRequestModal}/>
          <InfoItem label="Course / Program" value={profile.courseProgram} fieldName="courseProgram" onEditRequest={openRequestModal}/>
          <InfoItem label="Department" value={profile.department} fieldName="department" onEditRequest={openRequestModal}/>
          <InfoItem label="Current Year" value={profile.currentYear ? `Year ${profile.currentYear}` : 'N/A'} fieldName="currentYear" onEditRequest={openRequestModal} />
          <InfoItem label="Current Semester" value={profile.currentSemester ? `Semester ${profile.currentSemester}` : 'N/A'} fieldName="currentSemester" onEditRequest={openRequestModal}/>
          <InfoItem label="Academic Advisor" value={profile.academicAdvisorName} fieldName="academicAdvisorName" isEditable={true}/>
          <InfoItem label="Section / Batch" value={profile.sectionOrBatch} fieldName="sectionOrBatch" isEditable={true}/>
          <InfoItem label="Admission Date" value={profile.admissionDate} fieldName="admissionDate" onEditRequest={openRequestModal}/>
          <InfoItem label="Mode of Admission" value={profile.modeOfAdmission} fieldName="modeOfAdmission" isEditable={true}/>
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
                <DocumentOrActionItem label="ID Card" url={profile.idCardUrl} actionLabel="View ID Card" fieldName="idCardUrl" uploadable={true}/>
                <DocumentOrActionItem label="Admission Letter" url={profile.admissionLetterUrl} actionLabel="View Admission Letter" fieldName="admissionLetterUrl" uploadable={true}/>
                <DocumentOrActionItem label="10th Mark Sheet" url={profile.marksheet10thUrl} actionLabel="View 10th Mark Sheet" fieldName="marksheet10thUrl" uploadable={true}/>
                <DocumentOrActionItem label="12th Mark Sheet" url={profile.marksheet12thUrl} actionLabel="View 12th Mark Sheet" fieldName="marksheet12thUrl" uploadable={true}/>
                <DocumentOrActionItem label="Migration Certificate" url={profile.migrationCertificateUrl} actionLabel="View Migration Certificate" fieldName="migrationCertificateUrl" uploadable={true}/>
                <DocumentOrActionItem label="Bonafide Certificate" url={profile.bonafideCertificateUrl} actionLabel="Download Bonafide" isDownloadable={true} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <h4 className="mb-2 flex items-center text-md font-semibold text-foreground">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Uploaded Photo
                    </h4>
                    { (isEditMode && typeof editableProfile.uploadedPhotoUrl === 'string' ? editableProfile.uploadedPhotoUrl : profile.uploadedPhotoUrl) ? (
                    <Image
                        src={isEditMode && typeof editableProfile.uploadedPhotoUrl === 'string' ? editableProfile.uploadedPhotoUrl : profile.uploadedPhotoUrl!}
                        alt="Uploaded Photo"
                        width={100}
                        height={100}
                        className="rounded-md border object-cover shadow-sm"
                        data-ai-hint="passport photo"
                    />
                    ) : <p className="text-sm text-muted-foreground">N/A</p>}
                     {isEditMode && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => toast({title: "Upload (Placeholder)", description:"Upload for Uploaded Photo not implemented."})}>
                            <UploadCloud className="mr-2 h-4 w-4"/> Upload New Photo
                        </Button>
                    )}
                </div>
                <div>
                    <h4 className="mb-2 flex items-center text-md font-semibold text-foreground">
                        <FileImage className="mr-2 h-5 w-5 text-muted-foreground" />
                        Uploaded Signature
                    </h4>
                    {(isEditMode && typeof editableProfile.uploadedSignatureUrl === 'string' ? editableProfile.uploadedSignatureUrl : profile.uploadedSignatureUrl) ? (
                    <Image
                        src={isEditMode && typeof editableProfile.uploadedSignatureUrl === 'string' ? editableProfile.uploadedSignatureUrl : profile.uploadedSignatureUrl!}
                        alt="Uploaded Signature"
                        width={200}
                        height={80}
                        className="rounded-md border bg-white object-contain p-1 shadow-sm" 
                        data-ai-hint="signature"
                    />
                    ) : <p className="text-sm text-muted-foreground">N/A</p>}
                    {isEditMode && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => toast({title: "Upload (Placeholder)", description:"Upload for Uploaded Signature not implemented."})}>
                            <UploadCloud className="mr-2 h-4 w-4"/> Upload New Signature
                        </Button>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Exam Details Section */}
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <ClipboardList className="mr-3 h-6 w-6 text-primary" />
                Exam Details
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem label="Exam Registration" value={profile.examRegistrationStatus} fieldName="examRegistrationStatus" onEditRequest={openRequestModal}/>
            <DocumentOrActionItem label="Admit Card" url={profile.admitCardUrl} actionLabel="Download Admit Card" isDownloadable={true} icon={Download} fieldName="admitCardUrl" uploadable={true}/>
            <DocumentOrActionItem label="Internal Exam Timetable" url={profile.internalExamTimetableUrl} actionLabel="View Timetable" icon={Eye} fieldName="internalExamTimetableUrl" uploadable={true}/>
            <DocumentOrActionItem label="External Exam Timetable" url={profile.externalExamTimetableUrl} actionLabel="View Timetable" icon={Eye} fieldName="externalExamTimetableUrl" uploadable={true}/>
            <DocumentOrActionItem label="Results and Grade Cards" url={profile.resultsAndGradeCardsUrl} actionLabel="View Results" icon={Eye} fieldName="resultsAndGradeCardsUrl" uploadable={true}/>
            <div className="md:col-span-1">
                <DocumentOrActionItem
                    label={`Revaluation (${profile.revaluationRequestStatus || 'N/A'})`}
                    url={profile.revaluationRequestStatus === 'None' && profile.revaluationRequestLink ? profile.revaluationRequestLink : undefined}
                    actionLabel={profile.revaluationRequestStatus === 'None' ? 'Request Revaluation' : undefined}
                    icon={Edit3}
                    actionType={profile.revaluationRequestStatus === 'None' ? 'link' : 'button'}
                />
            </div>
        </CardContent>
      </Card>

       {/* Change Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Change for {requestFieldInfo?.label}</DialogTitle>
            <DialogDescription>
              Your request to change "{requestFieldInfo?.label}" will be sent to an administrator for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentValue" className="text-right col-span-1">
                Current Value
              </Label>
              <Input id="currentValue" value={requestOldValue} readOnly className="col-span-3 bg-muted" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newValue" className="text-right col-span-1">
                New Value
              </Label>
              <Input
                id="newValue"
                value={requestNewValue}
                onChange={(e) => setRequestNewValue(e.target.value)}
                className="col-span-3"
                placeholder={`Enter new ${requestFieldInfo?.label.toLowerCase()}`}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => setRequestFieldInfo(null)}>Cancel</Button></DialogClose>
            <Button onClick={handleSubmitChangeRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            My Profile
          </h2>
        </div>
        <Suspense fallback={
            <div className="space-y-6">
                <Skeleton className="h-12 w-32 self-end" /> 
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-72 w-full rounded-lg" />
                <Skeleton className="h-80 w-full rounded-lg" />
                <Skeleton className="h-72 w-full rounded-lg" />
            </div>
        }>
          <ProfileDetailsLoader />
        </Suspense>
      </div>
    </>
  );
}
