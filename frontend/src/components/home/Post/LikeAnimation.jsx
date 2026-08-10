import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export const LikeAnimation = ({ post, journeyLikeAnim }) => {
  return (
    <AnimatePresence>
      {journeyLikeAnim?.postId === post._id && (
        <motion.div
          key={journeyLikeAnim.key}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <span className="text-6xl drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
            ✨
          </span>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 bg-black/50 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
          >
            Journey Felt
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LikeAnimation;
