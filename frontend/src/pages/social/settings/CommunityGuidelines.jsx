import React from 'react';
import { Heart, Shield, Compass, Lock, BadgeCheck, ShieldAlert, Eye, MessageCircle, Flag, Scale, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const GUIDELINES = [
{
  icon: Heart,
  title: 'Respect & Kindness',
  color: '#EC4899',
  bg: '#FDF2F8',
  items: [
  'Treat every traveler with courtesy, regardless of background, nationality, or travel style.',
  'Avoid offensive language, personal attacks, or discriminatory remarks in chats and posts.',
  'Disagreements happen — resolve them respectfully or disengage.']

},
{
  icon: Shield,
  title: 'Safety First',
  color: '#22C55E',
  bg: '#F0FDF4',
  items: [
  'Never pressure someone to share personal information like their hotel address or travel schedule.',
  'If you feel unsafe during a journey or meetup, trust your instincts and remove yourself from the situation.',
  'Use the Emergency Contacts feature to keep trusted people informed during trips.']

},
{
  icon: Compass,
  title: 'Journey Responsibility',
  color: '#F59E0B',
  bg: '#FFFBEB',
  items: [
  'Honor commitments — if you join a journey, communicate promptly about any changes.',
  'Journey hosts can set rules, manage members, and remove anyone who disrupts the group.',
  'If a journey is no longer a good fit, use the Leave Journey option rather than going silent.']

},
{
  icon: Lock,
  title: 'Privacy',
  color: '#3B82F6',
  bg: '#EFF6FF',
  items: [
  'Do not share another traveler\'s photos, location, or personal details without their consent.',
  'Respect the privacy settings others have chosen for their profiles and visibility.',
  'Keep private conversations private — do not screenshot or forward messages without permission.']

},
{
  icon: BadgeCheck,
  title: 'Authentic Content',
  color: '#8B5CF6',
  bg: '#F5F3FF',
  items: [
  'Share genuine travel experiences, photos, and reviews.',
  'Do not impersonate other travelers or misrepresent your identity.',
  'Keep trip details accurate — misleading descriptions waste everyone\'s time.']

},
{
  icon: ShieldAlert,
  title: 'No Spam or Scams',
  color: '#EF4444',
  bg: '#FEF2F2',
  items: [
  'Do not use Go YatriGo to promote products, services, or external links unrelated to travel.',
  'Never solicit money or financial details from other travelers.',
  'Suspicious accounts or repeated spam behavior can be reported and may lead to suspension.']

},
{
  icon: Eye,
  title: 'Appropriate Content',
  color: '#06B6D4',
  bg: '#ECFEFF',
  items: [
  'All shared photos and posts should be appropriate for a general audience.',
  'Do not post violent, explicit, or graphic content.',
  'Travel memories should celebrate experiences — not promote illegal activities.']

},
{
  icon: MessageCircle,
  title: 'Journey Group Chats',
  color: '#7C3AED',
  bg: '#F3E8FF',
  items: [
  'Keep group chat conversations relevant to the journey.',
  'Journey hosts can block disruptive participants from the chat.',
  'Use direct messages for personal conversations instead of cluttering group chats.']

},
{
  icon: Flag,
  title: 'Reporting',
  color: '#F97316',
  bg: '#FFF7ED',
  items: [
  'Use the Report feature on profiles and content to flag behavior that violates these guidelines.',
  'You can block users directly from their profile to prevent further contact.',
  'Submitting a report does not notify the reported user.']

},
{
  icon: Scale,
  title: 'Consequences',
  color: '#64748B',
  bg: '#F8FAFC',
  items: [
  'Violations may result in warnings, temporary suspension, or permanent account removal.',
  'Suspended accounts lose access to all journeys, chats, and social features.',
  'Account actions are based on reported behavior and admin review.']

}];


const GuidelineCard = ({ icon: Icon, title, color, bg, items }) =>
<div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div
    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
    style={{ background: bg }}>

        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="text-base font-bold text-[#1E293B]">{title}</h3>
    </div>
    <ul className="space-y-3">
      {items.map((text, i) =>
    <li key={i} className="flex items-start gap-2.5">
          <span
      className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: color }} />

          <span className="text-sm text-[#64748B] leading-relaxed">{text}</span>
        </li>
    )}
    </ul>
  </div>;


const CommunityGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 pt-10 lg:pt-4">
      <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-5">

        <div className="flex items-center gap-3 mb-5">
          <button
          onClick={() => navigate('/settings')}
          className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">

            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#1E293B]">Community Guidelines</h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">Creating a respectful and trustworthy travel community</p>
          </div>
        </div>

        <div
        className="p-6 shadow-sm"
        style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '24px', borderLeft: '4px solid #7C3AED' }}>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3E8FF' }}>
              <Heart className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B] mb-1">Travel Better, Together</h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Go YatriGo connects travelers who share a love of exploration. These guidelines help keep the community welcoming, safe, and genuine for everyone.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIDELINES.map((g) =>
          <GuidelineCard key={g.title} {...g} />
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-base font-bold text-[#1E293B] mb-3">Need Help?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
            to="/report"
            className="flex items-center gap-3 p-4 rounded-2xl bg-[#F8FAFC] hover:bg-slate-100 transition-colors">

              <Flag className="w-4 h-4 text-[#F97316]" />
              <span className="text-sm font-semibold text-[#1E293B]">Report a Problem</span>
            </Link>
            <Link
            to="/blocked-users"
            className="flex items-center gap-3 p-4 rounded-2xl bg-[#F8FAFC] hover:bg-slate-100 transition-colors">

              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
              <span className="text-sm font-semibold text-[#1E293B]">Manage Blocked Users</span>
            </Link>
          </div>
        </div>

        <div className="text-center p-4 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
          <p className="text-xs text-[#64748B]">
            These guidelines apply to all interactions on Go YatriGo — posts, messages, journeys, and profiles. Thank you for helping build a better travel community.
          </p>
        </div>

      </div>
    </div>);

};

export default CommunityGuidelines;