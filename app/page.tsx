import { LanguageProvider } from "../context/LanguageContext";
import InvitationMain from "../components/InvitationMain";

export default function Home() {
  return (
    <LanguageProvider>
      <InvitationMain guest={null} />
    </LanguageProvider>
  );
}
