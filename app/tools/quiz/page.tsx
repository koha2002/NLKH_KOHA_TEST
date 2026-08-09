"use client";

import { ToolFrame } from "../../../components/ToolFrame";
import { QuizDataPicker } from "../../../components/QuizDataPicker";
import { useLanguage } from "../../../components/LanguageProvider";
import styles from "../tool-page.module.css";

export default function QuizPage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  return <main className={styles.fullTool}>
    <QuizDataPicker />
    <ToolFrame src="/tool-modules/quiz/index.html?v=10" title={vi ? "Công cụ ôn thi" : "Quiz practice tool"} tall flush importTarget="quiz" />
  </main>;
}
