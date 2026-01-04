import { getCurrentZone, newZoneSpec, onZoneError, runInZone, runInZoneAsync } from '../zoneClass.js';

onZoneError((err, zone) => {
    console.error(`Error in zone ${zone.id}:`, err);
    return true;
});

runInZone(() => {
    console.log('Initial Zone');
    console.log('Current Zone ID:', getCurrentZone().id);

    runInZone(() => {
        console.log('Nested Zone');
        console.log('Current Zone ID:', getCurrentZone().id);

        runInZone(() => {
            console.log('Innermost Zone (using current zone)');
            console.log('Current Zone ID:', getCurrentZone().id);
        });

        runInZone(() => {
            console.log('Innermost Zone (new zone)');
            console.log('Current Zone ID:', getCurrentZone().id);
            throw new Error('Test error in innermost zone');
        }, newZoneSpec('innermost-zone'));

        // Async/await style using an async function
        runInZoneAsync(async () => {
            console.log('Async/Await Zone');
            console.log('Current Zone ID:', getCurrentZone().id);
            await new Promise((resolve) => setTimeout(() => resolve(), 64));
        }, newZoneSpec('innermost-async-zone'));
    }, newZoneSpec('nested-zone'));
}, newZoneSpec('initial-zone'));
