import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState(() => {
        try {
            // 1. Check URL parameters
            const params = new URLSearchParams(window.location.search);
            const langParam = params.get('lang');
            if (langParam === 'bn' || langParam === 'en') {
                localStorage.setItem('language', langParam);
                return langParam;
            }
            
            // 2. Check localStorage
            const storedLang = localStorage.getItem('language');
            if (storedLang === 'bn' || storedLang === 'en') {
                return storedLang;
            }
        } catch (e) {
            console.error("Error detecting language preference", e);
        }
        
        // 3. Default to 'bn' (Bangla) since this is a Bangla-centric platform
        return 'bn';
    });

    const setLanguage = (lang: string) => {
        try {
            localStorage.setItem('language', lang);
        } catch (e) {
            console.error("Error saving language preference", e);
        }
        setLanguageState(lang);
    };

    // Basic translation mapping
    const translations: Record<string, Record<string, string>> = {
        en: {
            cash_on_delivery: 'Cash on Delivery',
            full_name: 'Full Name',
            phone_number: 'Phone Number',
            select_variant: 'Select Variant',
            district: 'District',
            select_district: 'Select District',
            area_upazila: 'Area / Upazila',
            select_area: 'Select Area',
            address_details: 'Address Details',
            subtotal: 'Subtotal',
            shipping: 'Shipping',
            total_amount: 'Total Amount',
            place_order: 'Place Order',
            trending_now: 'Trending Now',
            top_trending: 'Top Trending Products',
            add_cart: 'Add to Cart',
            todays_offer: 'Today\'s Offer',
            save_discount: 'Save',
            secure_your_order: 'Secure Your Order',
            free_shipping: 'Free Shipping',
            money_back_guarantee: 'Money Back Guarantee',
            premium: 'Premium',
            quality: 'Quality',
            reviews: 'Reviews',
            description: 'Description',
            safe_secure_checkout: 'Safe & Secure Checkout',
            complete_order: 'Complete Your Order',
            fill_in_details_desc: 'Please fill in your details below to confirm your order.',
            write_full_address: 'Write your full address here...',
            shipping_method: 'Shipping Method',
            product: 'Product',
            secure_checkout_100: '100% Secure Checkout',
            real_customer_reviews: 'Real Customer Reviews',
            customer_review: 'Customer Review',
            fill_out_form_to_order: 'Fill out the form below to order',
            fill_form_to_order: 'Fill out the form to order',
            no_products_found: 'No products found'
        },
        bn: {
            cash_on_delivery: 'ক্যাশ অন ডেলিভারি',
            full_name: 'আপনার নাম',
            phone_number: 'ফোন নম্বর',
            select_variant: 'ভ্যারিয়েন্ট নির্বাচন করুন',
            district: 'জেলা',
            select_district: 'জেলা নির্বাচন করুন',
            area_upazila: 'থানা / উপজেলা',
            select_area: 'থানা নির্বাচন করুন',
            address_details: 'বিস্তারিত ঠিকানা',
            subtotal: 'সাবটোটাল',
            shipping: 'ডেলিভারি চার্জ',
            total_amount: 'মোট পরিমাণ',
            place_order: 'অর্ডার নিশ্চিত করুন',
            trending_now: 'ট্রেন্ডিং',
            top_trending: 'শীর্ষ ট্রেন্ডিং পণ্য',
            add_cart: 'কার্টে যোগ করুন',
            todays_offer: 'আজকের অফার',
            save_discount: 'সাশ্রয়',
            secure_your_order: 'অর্ডার করুন',
            free_shipping: 'ফ্রি শিপিং',
            money_back_guarantee: 'মানি ব্যাক গ্যারান্টি',
            premium: 'প্রিমিয়াম',
            quality: 'কোয়ালিটি',
            reviews: 'রিভিউ',
            description: 'বিস্তারিত',
            safe_secure_checkout: 'নিরাপদ চেকআউট',
            complete_order: 'অর্ডার সম্পন্ন করুন',
            fill_in_details_desc: 'অর্ডারটি সম্পন্ন করতে নিচের তথ্যগুলো পূরণ করুন।',
            write_full_address: 'আপনার বিস্তারিত ঠিকানা এখানে লিখুন...',
            shipping_method: 'শিপিং পদ্ধতি',
            product: 'পণ্য',
            secure_checkout_100: '১০০% নিরাপদ চেকআউট',
            real_customer_reviews: 'আমাদের কাস্টমারদের বাস্তব রিভিউজ',
            customer_review: 'কাস্টমার রিভিউ',
            fill_out_form_to_order: 'অর্ডার করতে নিচের ফর্মটি সঠিক ভাবে পূরণ করুন',
            fill_form_to_order: 'অর্ডার করতে ফর্মটি পূরণ করুন',
            no_products_found: 'কোনো পণ্য পাওয়া যায়নি'
        }
    };

    const t = (key: string) => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
