// src/utils/dataLayer.ts

export const pushToDataLayer = (data: any) => {
    // Ensure dataLayer exists
    const dataLayer = (window as any).dataLayer = (window as any).dataLayer || [];
    
    // Clear the previous ecommerce object to prevent data bleeding between events
    if (data.ecommerce) {
        dataLayer.push({ ecommerce: null });
    }
    
    // Push the new event
    dataLayer.push(data);
};