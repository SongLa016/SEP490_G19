import React, { createContext, useContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'vi'
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'vi';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = (lang) => {
    // Tạm thời không hỗ trợ đổi sang ngôn ngữ khác
    // Nếu người dùng chọn tiếng Anh, hiển thị thông báo và giữ nguyên ngôn ngữ hiện tại
    if (lang === 'en') {
      Swal.fire({
        icon: 'info',
        title: 'Thông báo',
        text: 'Chức năng sẽ sớm được cải thiện',
        confirmButtonText: 'Đóng',
      });
      return;
    }

    setLanguage(lang);
  };

  const value = {
    language,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

