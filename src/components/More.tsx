import { useFirebase } from './FirebaseProvider';
import { db, doc, updateDoc, collection, getDocs, writeBatch, query, where } from '../lib/firebase';
import { UserProfile } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { User, Globe, Target, Bell, Download, Trash2, LogOut, Info, Camera, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { format, startOfMonth, startOfWeek } from 'date-fns';
import { cn } from '../lib/utils';
import { UI_CONSTANTS } from '../constants';
import { SectionHeader } from './SectionHeader';

export function More() {
  const { profile, user, logout, t } = useFirebase();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || '');
  const [exportFilter, setExportFilter] = useState<'all' | 'week' | 'month'>('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Max size is 2MB.");
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await updateProfile({ photoURL: base64String });
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      if (updates.name) setIsEditingName(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      let deedsRef = collection(db, 'users', user.uid, 'deeds');
      let q = query(deedsRef);

      if (exportFilter === 'week') {
        const start = format(startOfWeek(new Date()), 'yyyy-MM-dd');
        q = query(deedsRef, where('date', '>=', start));
      } else if (exportFilter === 'month') {
        const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        q = query(deedsRef, where('date', '>=', start));
      }

      const snapshot = await getDocs(q);
      const deeds = snapshot.docs.map(doc => doc.data());
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Time,Pillar,Action,Duration,Feeling,Thought\n"
        + deeds.map(d => `${d.date},${d.time},${d.pillar},"${d.actionName}",${d.duration || ''},${d.feeling},"${d.thought || ''}"`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `quest_deeds_${exportFilter}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    
    try {
      const deedsRef = collection(db, 'users', user.uid, 'deeds');
      const snapshot = await getDocs(deedsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting all deeds:', error);
    }
  };

  return (
    <div className="py-4 md:py-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <SectionHeader 
          title={t('settings')}
          subtitle={t('preferences')}
        />
        <Button 
          variant="outline" 
          onClick={logout}
          className={cn("border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:text-red-500 transition-all font-black uppercase tracking-widest h-10 px-4 text-[10px]", UI_CONSTANTS.buttonRadius)}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('logout')}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2">{t('profile')}</h3>
            <Card className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden group", UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="relative">
                    <div className={cn("w-32 h-32 bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 group-hover:scale-105 transition-transform overflow-hidden relative", UI_CONSTANTS.cardRadius)}>
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-16 h-16 text-white" />
                      )}
                      
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}

                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                        <Camera className="w-10 h-10 text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-4 w-full">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 max-w-sm mx-auto md:mx-0">
                        <Input 
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className={cn("bg-zinc-50 dark:bg-zinc-800 border-none font-bold h-12 uppercase tracking-tighter text-xl", UI_CONSTANTS.inputRadius)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateProfile({ name: tempName });
                            if (e.key === 'Escape') setIsEditingName(false);
                          }}
                        />
                        <Button size="sm" onClick={() => updateProfile({ name: tempName })} disabled={isUpdating} className={cn("h-12 px-6 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px]", UI_CONSTANTS.buttonRadius)}>Save</Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                          <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">{profile?.name || 'Guest'}</h3>
                          <Button variant="ghost" size="sm" onClick={() => { setIsEditingName(true); setTempName(profile?.name || ''); }} className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-indigo-500">
                            <Info className="w-5 h-5" />
                          </Button>
                        </div>
                        <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">{profile?.email}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                       <span className="px-4 py-2 rounded-full bg-indigo-500/5 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/10">
                        Original Member
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2">{t('preferences')}</h3>
            <Card className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden", UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-0">
                {[
                  { 
                    id: 'language', 
                    label: t('language'), 
                    icon: Globe, 
                    component: (
                      <Select 
                        value={profile?.language || "en"} 
                        onValueChange={(v: "en" | "fr" | null) => v && updateProfile({ language: v })}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className={cn("w-36 h-11 bg-zinc-100 dark:bg-zinc-800 border-none text-[10px] font-black uppercase tracking-widest", UI_CONSTANTS.buttonRadius)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                          <SelectItem value="en" className="font-bold">ENGLISH</SelectItem>
                          <SelectItem value="fr" className="font-bold">FRANÇAIS</SelectItem>
                        </SelectContent>
                      </Select>
                    )
                  },
                  { 
                    id: 'theme', 
                    label: t('theme'), 
                    icon: Bell, 
                    component: (
                      <Select 
                        value={profile?.theme || "system"} 
                        onValueChange={(v: "light" | "dark" | "system" | null) => v && updateProfile({ theme: v })}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className={cn("w-36 h-11 bg-zinc-100 dark:bg-zinc-800 border-none text-[10px] font-black uppercase tracking-widest", UI_CONSTANTS.buttonRadius)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                          <SelectItem value="light" className="font-bold">{t('light').toUpperCase()}</SelectItem>
                          <SelectItem value="dark" className="font-bold">{t('dark').toUpperCase()}</SelectItem>
                          <SelectItem value="system" className="font-bold">{t('system').toUpperCase()}</SelectItem>
                        </SelectContent>
                      </Select>
                    )
                  },
                  { 
                    id: 'objective', 
                    label: t('dailyObjective'), 
                    icon: Target, 
                    component: (
                      <Input 
                        type="number" 
                        value={profile?.dailyObjective} 
                        onChange={(e) => updateProfile({ dailyObjective: parseInt(e.target.value) })}
                        className={cn("w-24 h-11 bg-zinc-100 dark:bg-zinc-800 border-none text-center font-black text-sm", UI_CONSTANTS.inputRadius)}
                        disabled={isUpdating}
                      />
                    )
                  }
                ].map((item, i, arr) => (
                  <div key={item.id}>
                    <div className="p-8 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={cn("w-12 h-12 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center transition-transform hover:scale-110", UI_CONSTANTS.buttonRadius)}>
                          <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{item.label}</span>
                      </div>
                      {item.component}
                    </div>
                    {i < arr.length - 1 && <Separator className="bg-zinc-100 dark:bg-zinc-800 mx-8 opacity-50" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-12">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2">{t('dataManagement')}</h3>
            <Card className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden", UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] px-1">Export Range</p>
                  <Select value={exportFilter} onValueChange={(v: any) => setExportFilter(v)}>
                    <SelectTrigger className={cn("w-full bg-zinc-50 dark:bg-zinc-800 border-none font-black text-[10px] uppercase tracking-widest h-14", UI_CONSTANTS.inputRadius)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                      <SelectItem value="all" className="font-bold">ALL TIME</SelectItem>
                      <SelectItem value="week" className="font-bold">THIS WEEK</SelectItem>
                      <SelectItem value="month" className="font-bold">THIS MONTH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleExport}
                  className={cn("w-full justify-start gap-5 h-16 px-8 bg-black dark:bg-zinc-100 text-white dark:text-black font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:-translate-y-1 active:scale-95", UI_CONSTANTS.buttonRadius)}
                >
                  <Download className="w-5 h-5" />
                  {t('exportData')}
                </Button>

                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                  <DialogTrigger>
                    <Button 
                      variant="outline" 
                      className={cn("w-full justify-start gap-5 h-16 px-8 border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 text-zinc-400 font-black uppercase tracking-widest text-[10px] border-dashed transition-all", UI_CONSTANTS.buttonRadius)}
                    >
                      <Trash2 className="w-5 h-5" />
                      {t('deleteAll')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={cn("bg-white dark:bg-zinc-900 border-none max-w-sm p-10", UI_CONSTANTS.cardRadius)}>
                    <DialogHeader className="text-left space-y-4">
                      <DialogTitle className="text-4xl font-black tracking-tighter text-red-600 uppercase italic leading-none">Danger Zone</DialogTitle>
                      <DialogDescription className="font-bold text-zinc-500 py-2 leading-relaxed uppercase tracking-tighter text-xs">
                        This will permanently delete all your logged deeds and stats. This action <span className="text-red-600 underline">cannot be undone</span>.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-3 mt-6">
                       <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className={cn("h-14 font-black uppercase text-[10px] tracking-widest border-zinc-200 dark:border-zinc-800", UI_CONSTANTS.buttonRadius)}>Keep my data</Button>
                       <Button onClick={handleDeleteAll} className={cn("bg-red-600 hover:bg-red-500 text-white h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20", UI_CONSTANTS.buttonRadius)}>Delete Everything</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
             <div className={cn("bg-zinc-100 dark:bg-zinc-900/50 p-10 space-y-8 text-center", UI_CONSTANTS.cardRadius)}>
               <div className="space-y-2">
                 <div className={cn("w-14 h-14 bg-white dark:bg-zinc-800 flex items-center justify-center mx-auto shadow-sm", UI_CONSTANTS.buttonRadius)}>
                   <Info className="w-7 h-7 text-zinc-400" />
                 </div>
                 <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em]">Quest v1.0.0</p>
               </div>
               
               <div className="grid grid-cols-1 gap-2">
                 <Button variant="ghost" className={cn("h-12 font-black uppercase tracking-widest text-[10px] text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800", UI_CONSTANTS.buttonRadius)}>Support & Help</Button>
                 <Button variant="ghost" className={cn("h-12 font-black uppercase tracking-widest text-[10px] text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800", UI_CONSTANTS.buttonRadius)}>Send Feedback</Button>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
