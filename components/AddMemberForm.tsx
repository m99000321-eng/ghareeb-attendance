"use client";
import { FormEvent, useState } from "react";
export default function AddMemberForm(){
 const [form,setForm]=useState({name:"",role:"player",sport:"MMA",phone:"",parentPhone:"",group:"",tier:"junior"});
 const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setLoading(true);setMessage("");
  try{const r=await fetch("/api/members",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw new Error(d.error||"تعذر إضافة الشخص");setMessage("تمت إضافة الشخص بنجاح.");setForm({name:"",role:"player",sport:"MMA",phone:"",parentPhone:"",group:"",tier:"junior"});}
  catch(e){setMessage(e instanceof Error?e.message:"حدث خطأ");}finally{setLoading(false);}
 }
 const input="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-lime/50";
 return <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
  <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-white/55">الاسم بالكامل</label><input required minLength={3} className={input} value={form.name} placeholder="اكتب اسم الشخص" onChange={e=>setForm({...form,name:e.target.value})}/></div>
  <div><label className="mb-1.5 block text-xs font-semibold text-white/55">نوع الشخص</label><select className={input} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="player">لاعب</option><option value="coach">مدرب</option></select></div>
  <div><label className="mb-1.5 block text-xs font-semibold text-white/55">الرياضة</label><select className={input} value={form.sport} onChange={e=>setForm({...form,sport:e.target.value})}><option value="ملاكمة">ملاكمة</option><option value="كيك بوكس">كيك بوكس</option><option value="كونغ فو">كونغ فو</option><option value="MMA">MMA</option></select></div>
  <div><label className="mb-1.5 block text-xs font-semibold text-white/55">رقم الهاتف</label><input className={input} inputMode="tel" placeholder="01xxxxxxxxx" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
  <div><label className="mb-1.5 block text-xs font-semibold text-white/55">رقم ولي الأمر</label><input className={input} inputMode="tel" placeholder="01xxxxxxxxx" value={form.parentPhone} onChange={e=>setForm({...form,parentPhone:e.target.value})}/></div>
  <div><label className="mb-1.5 block text-xs font-semibold text-white/55">المجموعة</label><input className={input} placeholder="مثال: المجموعة A" value={form.group} onChange={e=>setForm({...form,group:e.target.value})}/></div>
  <div><label className="mb-1.5 block text-xs font-semibold text-white/55">المستوى</label><select className={input} value={form.tier} onChange={e=>setForm({...form,tier:e.target.value})}><option value="junior">ناشئ</option><option value="senior">كبار</option></select></div>
  <div className="md:col-span-2 flex items-center gap-3"><button disabled={loading} className="rounded-xl bg-lime px-5 py-3 text-sm font-extrabold text-ink disabled:opacity-60">{loading?"جاري الإضافة...":"إضافة الشخص"}</button>{message?<span className="text-xs text-lime">{message}</span>:null}</div>
 </form>;
}