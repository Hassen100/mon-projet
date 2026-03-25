// Diagnostic script for Angular-Google Analytics integration
// Run this in browser console when on the dashboard

console.log('🔍 Diagnostic de l\'intégration Google Analytics');

// 1. Test if AnalyticsService is available
if (window.ng && window.ng.getComponent) {
    const dashboardElement = document.querySelector('app-dashboard');
    if (dashboardElement) {
        const component = window.ng.getComponent(dashboardElement);
        console.log('✅ Dashboard component found:', component);
        
        // Check if analyticsService is available
        if (component.analyticsService) {
            console.log('✅ AnalyticsService available');
            
            // Test API calls
            console.log('🧪 Testing API calls...');
            
            // Test health check
            component.analyticsService.healthCheck().subscribe({
                next: (data) => console.log('✅ Health check success:', data),
                error: (err) => console.error('❌ Health check failed:', err)
            });
            
            // Test overview
            component.analyticsService.getOverview().subscribe({
                next: (data) => console.log('✅ Overview data:', data),
                error: (err) => console.error('❌ Overview failed:', err)
            });
            
            // Test sync
            component.analyticsService.syncAllData().subscribe({
                next: (data) => console.log('✅ Sync data:', data),
                error: (err) => console.error('❌ Sync failed:', err)
            });
            
        } else {
            console.error('❌ AnalyticsService not found in component');
        }
    } else {
        console.error('❌ Dashboard component not found');
    }
} else {
    console.error('❌ Angular not detected or not in debug mode');
}

// 2. Test direct API calls
console.log('🌐 Testing direct API calls...');

fetch('http://127.0.0.1:8000/api/analytics/health/')
    .then(response => response.json())
    .then(data => console.log('✅ Direct health check:', data))
    .catch(err => console.error('❌ Direct health check failed:', err));

fetch('http://127.0.0.1:8000/api/analytics/overview/')
    .then(response => response.json())
    .then(data => console.log('✅ Direct overview:', data))
    .catch(err => console.error('❌ Direct overview failed:', err));

// 3. Check syncGoogle method
console.log('🔄 Testing syncGoogle method...');
const syncButton = document.querySelector('button:contains("Sync Google")');
if (syncButton) {
    console.log('✅ Sync button found');
} else {
    console.log('❌ Sync button not found, checking all buttons...');
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, index) => {
        if (btn.textContent.includes('Sync') || btn.textContent.includes('Google')) {
            console.log(`🔍 Button ${index}:`, btn.textContent.trim());
        }
    });
}

console.log('🏁 Diagnostic completed. Check the results above.');
