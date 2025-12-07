"use client";
import { motion } from "framer-motion";
import { FaBriefcase, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

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
  return (
    <div className="relative py-8">
      {/* Vertical Line - Gradient */}
      <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 sm:w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-purple-500 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 transform md:-translate-x-1/2 opacity-30"></div>

      <div className="space-y-12 sm:space-y-16">
        {items.map((item, index) => {
          const isEven = index % 2 === 0;
          const isWork = item.type === "work";
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`relative flex flex-col md:flex-row items-center ${
                isEven ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Content Card */}
              <div className={`w-full md:w-5/12 ${isEven ? "md:pr-8" : "md:pl-8"} relative z-10 pl-12 md:pl-0`}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="relative group"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${
                    isWork 
                      ? "from-purple-500/20 to-blue-500/20 dark:from-purple-500/30 dark:to-blue-500/30" 
                      : "from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30"
                  } rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`}></div>
                  
                  {/* Card */}
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Decorative Corner */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${
                      isWork 
                        ? "from-purple-500/10 to-transparent" 
                        : "from-blue-500/10 to-transparent"
                    } rounded-bl-full`}></div>
                    
                    {/* Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${
                        isWork 
                          ? "bg-gradient-to-br from-purple-500 to-blue-500" 
                          : "bg-gradient-to-br from-blue-500 to-cyan-500"
                      } shadow-lg`}>
                        {isWork ? (
                          <FaBriefcase className="text-white text-xl" />
                        ) : (
                          <FaGraduationCap className="text-white text-xl" />
                        )}
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                        isWork 
                          ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300" 
                          : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                      }`}>
                        {isWork ? "İş Deneyimi" : "Eğitim"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300">
                      {item.title}
                    </h3>

                    {/* Organization */}
                    <div className="flex items-start gap-2 mb-3">
                      <FaMapMarkerAlt className="text-purple-500 dark:text-purple-400 text-sm mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg font-semibold text-purple-600 dark:text-purple-400 break-words">
                        {item.organization}
                      </p>
                    </div>

                    {/* Period */}
                    <div className="flex items-center gap-2 mb-4">
                      <FaCalendarAlt className="text-gray-400 dark:text-gray-500 text-sm flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                        {item.period}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Bottom Accent Line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                      isWork 
                        ? "from-purple-500 to-blue-500" 
                        : "from-blue-500 to-cyan-500"
                    }`}></div>
                  </div>
                </motion.div>
              </div>

              {/* Center Connector - Hidden on mobile */}
              <div className="hidden md:block w-2/12 flex-shrink-0"></div>

              {/* Timeline Dot - Always visible */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 -translate-y-1/2 top-1/2 z-20">
                <motion.div
                  whileHover={{ scale: 1.3 }}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-white dark:border-gray-900 shadow-xl ${
                    isWork 
                      ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                      : "bg-gradient-to-r from-blue-500 to-cyan-500"
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
