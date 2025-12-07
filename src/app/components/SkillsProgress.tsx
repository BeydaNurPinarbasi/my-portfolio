"use client";
import { motion } from "framer-motion";

interface Skill {
  name: string;
  percentage: number;
  color: string;
}

interface SkillsProgressProps {
  skills: Skill[];
}

export default function SkillsProgress({ skills }: SkillsProgressProps) {
  return (
    <div className="space-y-6">
      {skills.map((skill, index) => (
        <motion.div
          key={skill.name}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {skill.name}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {skill.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${skill.percentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
              className={`h-full rounded-full ${skill.color}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

