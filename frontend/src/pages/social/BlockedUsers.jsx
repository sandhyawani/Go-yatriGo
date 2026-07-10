import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { UserX, Unlock } from "lucide-react";
import { showToast } from "../../utils/showToast";
import { AuthContext } from "../../context/authContext";

const BlockedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, dispatch } = useContext(AuthContext);

  const fetchBlocked = async () => {
    try {
      const res = await axios.get("/users/blocked", { withCredentials: true });
      if (res.data.success) {
        setUsers(res.data.blockedUsers);
      }
    } catch (err) {
      showToast.error("Failed to fetch blocked users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (id) => {
    try {
      const res = await axios.post(`/users/unblock/${id}`, {}, { withCredentials: true });
      if (res.data.success) {
        setUsers(prev => prev.filter(u => u._id !== id));
        showToast.success("User unblocked");
        const freshSelf = await axios.get(`/users/${user._id}`, { withCredentials: true });
        const selfData = freshSelf.data.user || freshSelf.data;
        dispatch({ type: "LOGIN_SUCCESS", payload: { ...user, blockedUsers: selfData.blockedUsers } });
      }
    } catch (err) {
      showToast.error("Failed to unblock user");
    }
  };

  return (
    <div className=" bg-slate-50 pt-14 md:pt-0 pb-20">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <UserX className="w-6 h-6 text-rose-500" />
            Blocked Users
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage accounts you have blocked</p>
        </div>

        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
          {loading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500 mx-auto"></div></div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <UserX className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No blocked users.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map(user => (
                <div key={user._id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.pic || user.img || `https://ui-avatars.com/api/?name=${user.name}&background=eee`} 
                      alt={user.name} 
                      className="w-12 h-12 rounded-full object-cover border border-slate-200" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{user.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400">@{user.username || user._id.toString().slice(-6)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleUnblock(user._id)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2">
                    <Unlock className="w-3 h-3" /> Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BlockedUsers;

