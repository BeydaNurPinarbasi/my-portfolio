"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBriefcase, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface TimelineItem {
  type: "work" | "education";
  title: string;
  organization: string;
  period: string;
  description: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export default function Timeline({ items }: TimelineProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="relative py-4">
      {/* Vertical Line - Gradient */}
      <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 sm:w-1 bg-gradient-to-b from-slate-400 via-slate-600 to-slate-400 dark:from-slate-500 dark:via-slate-700 dark:to-slate-500 transform md:-translate-x-1/2 opacity-40"></div>

      <div className="space-y-4 sm:space-y-5">
        {items.map((item, index) => {
          const isEven = index % 2 === 0;
          const isWork = item.type === "work";
          const isOpen = openItems.has(index);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative flex flex-col md:flex-row items-center ${
                isEven ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Content Card */}
              <div className={`w-full md:w-5/12 ${isEven ? "md:pr-8" : "md:pl-8"} relative z-10 pl-12 md:pl-0`}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="relative group"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${
                    isWork 
                      ? "from-slate-500/20 to-slate-700/20 dark:from-slate-600/30 dark:to-slate-800/30" 
                      : "from-slate-400/20 to-slate-600/20 dark:from-slate-500/30 dark:to-slate-700/30"
                  } rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300`}></div>
                  
                  {/* Card */}
                  <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => toggleItem(index)}>
                    {/* Decorative Corner */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${
                      isWork 
                        ? "from-slate-500/10 to-transparent" 
                        : "from-slate-400/10 to-transparent"
                    } rounded-bl-full`}></div>
                    
                    {/* Card Header - Always Visible */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {/* Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${
                              isWork 
                                ? "bg-gradient-to-br from-slate-600 to-slate-800" 
                                : "bg-gradient-to-br from-slate-500 to-slate-700"
                            } shadow-md`}>
                              {isWork ? (
                                <FaBriefcase className="text-white text-xs" />
                              ) : (
                                <FaGraduationCap className="text-white text-xs" />
                              )}
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isWork 
                                ? "bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300" 
                                : "bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300"
                            }`}>
                              {isWork ? "İş Deneyimi" : "Eğitim"}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                            {item.title}
                          </h3>

                          {/* Organization */}
                          <div className="flex items-start gap-1.5 mb-1.5">
                            <FaMapMarkerAlt className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 break-words">
                              {item.organization}
                            </p>
                          </div>

                          {/* Period */}
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-gray-400 dark:text-gray-500 text-xs flex-shrink-0" />
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {item.period}
                            </p>
                          </div>
                        </div>

                        {/* Chevron Icon */}
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 mt-1"
                        >
                          {isOpen ? (
                            <FaChevronUp className="text-gray-400 dark:text-gray-500 text-sm" />
                          ) : (
                            <FaChevronDown className="text-gray-400 dark:text-gray-500 text-sm" />
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {/* Description - Collapsible */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-3">
                              {item.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottom Accent Line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                      isWork 
                        ? "from-slate-600 to-slate-800" 
                        : "from-slate-500 to-slate-700"
                    }`}></div>
                  </div>
                </motion.div>
              </div>

              {/* Center Connector - Hidden on mobile */}
              <div className="hidden md:block w-2/12 flex-shrink-0"></div>

              {/* Timeline Dot - Always visible */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 -translate-y-1/2 top-1/2 z-20">
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white dark:border-gray-900 shadow-lg ${
                    isWork 
                      ? "bg-gradient-to-r from-slate-600 to-slate-800" 
                      : "bg-gradient-to-r from-slate-500 to-slate-700"
                  }`}
                ></motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
