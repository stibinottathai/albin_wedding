"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ml";

interface Translations {
  [key: string]: {
    en: string;
    ml: string;
  };
}

const translations: Translations = {
  youAreInvited: {
    en: "You are invited",
    ml: "നിങ്ങൾക്ക് ക്ഷണമുണ്ട്",
  },
  openInvitation: {
    en: "Open Invitation",
    ml: "ക്ഷണക്കത്ത് തുറക്കുക",
  },
  clickSeal: {
    en: "Click the wax seal to open",
    ml: "ക്ഷണക്കത്ത് തുറക്കാൻ മുദ്രയിൽ ക്ലിക്ക് ചെയ്യുക",
  },
  revealDate: {
    en: "Reveal Our Special Day",
    ml: "വിവാഹ തീയതി കാണുക",
  },
  revealDateGuide: {
    en: "Tap to reveal our special day",
    ml: "തീയതി കാണാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യുക",
  },
  days: {
    en: "Days",
    ml: "ദിനങ്ങൾ",
  },
  hours: {
    en: "Hours",
    ml: "മണിക്കൂറുകൾ",
  },
  minutes: {
    en: "Minutes",
    ml: "മിനിറ്റുകൾ",
  },
  seconds: {
    en: "Seconds",
    ml: "സെക്കൻഡുകൾ",
  },
  ourStory: {
    en: "Our Story",
    ml: "ഞങ്ങളുടെ കഥ",
  },
  storyFirstMeeting: {
    en: "First Meeting",
    ml: "ആദ്യ കൂടിക്കാഴ്ച",
  },
  storyFriendship: {
    en: "Friendship",
    ml: "സൗഹൃദം",
  },
  storyLove: {
    en: "Love Story",
    ml: "പ്രണയം",
  },
  storyEngagement: {
    en: "Engagement",
    ml: "വിവാഹനിശ്ചയം",
  },
  storyWedding: {
    en: "Holy Matrimony",
    ml: "വിവാഹം",
  },
  schedule: {
    en: "Event Schedule",
    ml: "ചടങ്ങുകൾ",
  },
  venue: {
    en: "The Venue",
    ml: "വേദി",
  },
  viewMap: {
    en: "Open in Google Maps",
    ml: "ഗൂഗിൾ മാപ്സ് തുറക്കുക",
  },
  parking: {
    en: "Parking Information",
    ml: "പാർക്കിംഗ് സൗകര്യം",
  },
  contact: {
    en: "Contact Family",
    ml: "കുടുംബവുമായി ബന്ധപ്പെടുക",
  },
  rsvp: {
    en: "RSVP Attendance",
    ml: "പങ്കെടുക്കൽ അറിയിക്കുക",
  },
  rsvpSub: {
    en: "Kindly respond by November 15, 2026",
    ml: "2026 നവംബർ 15-നകം മറുപടി നൽകുക",
  },
  rsvpAccept: {
    en: "Joyfully Accepts",
    ml: "സന്തോഷത്തോടെ പങ്കെടുക്കുന്നു",
  },
  rsvpDecline: {
    en: "Regretfully Declines",
    ml: "പങ്കെടുക്കാൻ സാധിക്കാത്തതിൽ ഖേദിക്കുന്നു",
  },
  guestsCount: {
    en: "Number of Attendees",
    ml: "കൂടെ പങ്കെടുക്കുന്നവരുടെ എണ്ണം",
  },
  wishesLabel: {
    en: "Wishes or Message for the Couple",
    ml: "ദമ്പതികൾക്കുള്ള ആശംസകൾ",
  },
  submitRsvp: {
    en: "Submit RSVP",
    ml: "മറുപടി അയക്കുക",
  },
  rsvpSuccess: {
    en: "Thank you for your response!",
    ml: "നിങ്ങളുടെ മറുപടിക്ക് നന്ദി!",
  },
  gallery: {
    en: "Wedding Gallery",
    ml: "ഫോട്ടോ ഗാലറി",
  },
  video: {
    en: "Moments on Film",
    ml: "നിമിഷങ്ങൾ പകർത്തിയ ദൃശ്യങ്ങൾ",
  },
  wishes: {
    en: "Wishes Wall",
    ml: "ആശംസകൾ",
  },
  sendWish: {
    en: "Send Your Wishes",
    ml: "നിങ്ങളുടെ ആശംസകൾ അയക്കുക",
  },
  writeWishMsg: {
    en: "Write a message...",
    ml: "ആശംസകൾ എഴുതുക...",
  },
  yourName: {
    en: "Your Name",
    ml: "നിങ്ങളുടെ പേര്",
  },
  postWish: {
    en: "Post Wish",
    ml: "ആശംസ അയക്കുക",
  },
  wishPosted: {
    en: "Wish submitted! It will appear after moderation.",
    ml: "ആശംസ അയച്ചു! പരിശോധനയ്ക്ക് ശേഷം പ്രസിദ്ധീകരിക്കുന്നതാണ്.",
  },
  family: {
    en: "The Families",
    ml: "കുടുംബങ്ങൾ",
  },
  groomSide: {
    en: "Groom's Family",
    ml: "വരന്റെ കുടുംബം",
  },
  brideSide: {
    en: "Bride's Family",
    ml: "വധുവിന്റെ കുടുംബം",
  },
  parents: {
    en: "Parents",
    ml: "മാതാപിതാക്കൾ",
  },
  siblings: {
    en: "Siblings",
    ml: "സഹോദരങ്ങൾ",
  },
  faq: {
    en: "Frequently Asked Questions",
    ml: "ചില സംശയങ്ങൾ",
  },
  saveTheDate: {
    en: "Save the Date",
    ml: "കലണ്ടറിൽ കുറിക്കുക",
  },
  googleCalendar: {
    en: "Add to Google Calendar",
    ml: "ഗൂഗിൾ കലണ്ടറിൽ ചേർക്കുക",
  },
  shareWhatsapp: {
    en: "Share on WhatsApp",
    ml: "വാട്സാപ്പിൽ പങ്കുവെക്കുക",
  },
  soundOn: {
    en: "Sound On",
    ml: "ശബ്ദം ഓൺ ചെയ്യുക",
  },
  soundOff: {
    en: "Sound Off",
    ml: "ശബ്ദം ഓഫ് ചെയ്യുക",
  },
  personalizedGreeting: {
    en: "Dearest Guest,",
    ml: "പ്രിയപ്പെട്ട അതിഥീ,",
  },
  login: {
    en: "Login",
    ml: "ലോഗിൻ",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  // Hydrate language from local storage on client
  useEffect(() => {
    const saved = localStorage.getItem("wedding_invite_lang") as Language;
    if (saved === "en" || saved === "ml") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("wedding_invite_lang", lang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
