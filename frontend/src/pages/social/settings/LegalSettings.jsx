import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from '../../../api/axios';

const LegalSettings = () => {
  const { type } = useParams();
  const [content, setContent] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await axios.get(`/legal/${type}`);
        setContent(res.data.data);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };
    fetchContent();
  }, [type]);

  if (error) return <div className="p-8 text-center text-rose-500">Document not found</div>;
  if (!content) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 pt-14 lg:pt-4">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600" />
          <span>Back to Settings</span>
        </Link>
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100">
          <h1 className="text-3xl font-black text-slate-800 mb-8 pb-4 border-b border-slate-100">{content.title}</h1>
          <div className="prose prose-slate max-w-none">
            {/* Extremely simple markdown rendering simulation or just rendering as pre-wrap for now. */}
            <div className="whitespace-pre-wrap text-slate-600 text-sm leading-relaxed">
              {content.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalSettings;
