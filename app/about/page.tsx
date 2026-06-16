import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "عن الجامعة",
  description:
    "تعرّف على جامعة كبار العلماء، مرجعية موثوقة لطلب العلم الشرعي عن بعد، تقدم منهجًا متكاملًا لكلية الشريعة وفق علماء ربانيين كالشيخ محمد بن صالح العثيمين والشيخ صالح الفوزان، لكل طالب علم مبتدئ أو متقدم.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "عن الجامعة | جامعة كبار العلماء",
    description:
      "مرجعية موثوقة لطلب العلم الشرعي عن بعد — منهج كلية الشريعة بأصوات كبار العلماء الثقات.",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
