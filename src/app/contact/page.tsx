import type { Metadata } from "next";
import { ContactPage } from "@/components/contact/ContactPage";

export const metadata: Metadata = {
  title: "კონტაქტი",
  description:
    "დაგვიკავშირდი SpaceEdu-ს — კითხვა, იდეა თუ თანამშრომლობის შეთავაზება. მოგვწერე support@spaceedu.ge-ზე.",
  alternates: { canonical: "/contact" },
};

export default function ContactRoute() {
  return <ContactPage />;
}
