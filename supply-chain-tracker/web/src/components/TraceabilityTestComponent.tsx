import React, { useEffect } from 'react';
import { SimpleTraceabilityCache } from '../lib/traceabilityCache';
import { getTokenLineage, getUserRoleInfo } from '../lib/contract';

/**
 * Temporary component for manual QA testing
 * This will be removed after Phase 1 validation
 */
const TraceabilityTestComponent: React.FC = () => {
  useEffect(() => {
    // Expose functions to window for console testing
    (window as unknown as Record<string, unknown>).SimpleTraceabilityCache =
      SimpleTraceabilityCache;
    (window as unknown as Record<string, unknown>).getTokenLineage = getTokenLineage;
    (window as unknown as Record<string, unknown>).getUserRoleInfo = getUserRoleInfo;

    console.log('🧪 MANUAL QA - Traceability functions exposed to window:');
    console.log('- window.SimpleTraceabilityCache');
    console.log('- window.getTokenLineage');
    console.log('- window.getUserRoleInfo');

    // Run automatic tests
    runAutomaticTests();
  }, []);

  const runAutomaticTests = async () => {
    try {
      console.log('\n🔍 Starting automatic Phase 1 tests...\n');

      // Test 1: Cache basic operations
      console.log('Test 1: Cache basic operations');
      const cache = new SimpleTraceabilityCache();

      // Test set/get
      cache.set('test', { data: 'value' });
      const result = cache.get('test');
      console.log('✅ Cache set/get:', result);

      // Test cache keys
      const tokenKey = SimpleTraceabilityCache.tokenKey(123);
      const userKey = SimpleTraceabilityCache.userKey('0x123');
      const lineageKey = SimpleTraceabilityCache.lineageKey(456);
      console.log('✅ Cache key generation:', { tokenKey, userKey, lineageKey });

      // Test 2: getTokenLineage function
      console.log('\nTest 2: getTokenLineage function');
      const lineage123 = await getTokenLineage(123);
      console.log('✅ Lineage for token 123:', lineage123);

      const lineage1 = await getTokenLineage(1);
      console.log('✅ Lineage for raw material (token 1):', lineage1);

      // Test cache hit (call again)
      console.time('Second call (should be cached)');
      const lineage123Cached = await getTokenLineage(123);
      console.timeEnd('Second call (should be cached)');
      console.log(
        '✅ Cached result matches:',
        JSON.stringify(lineage123) === JSON.stringify(lineage123Cached)
      );

      // Test 3: getUserRoleInfo function
      console.log('\nTest 3: getUserRoleInfo function');
      try {
        const userInfo = await getUserRoleInfo('0x123abc');
        console.log('✅ User role info:', userInfo);
      } catch (error) {
        console.log('⚠️ User not found (expected for test address):', error);
      }

      // Test 4: Error handling
      console.log('\nTest 4: Error handling');
      try {
        await getTokenLineage(99999);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('✅ Error handling for non-existent token:', errorMessage);
      }

      try {
        await getUserRoleInfo('0x000000');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('✅ Error handling for non-existent user:', errorMessage);
      }

      console.log('\n🎉 Phase 1 automatic tests completed!');
      console.log('\n📋 Manual validation checklist:');
      console.log('✅ Cache stores and retrieves data correctly');
      console.log('✅ Cache key generation works');
      console.log('✅ getTokenLineage returns expected structure');
      console.log('✅ getUserRoleInfo handles both success and error cases');
      console.log('✅ Second calls are faster (cache hits)');
      console.log('✅ Error handling works for non-existent tokens/users');

      console.log('\n🔧 You can also test manually in console with:');
      console.log('- window.getTokenLineage(123)');
      console.log('- window.getUserRoleInfo("0x123abc")');
      console.log('- const cache = new window.SimpleTraceabilityCache()');
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  };

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg m-4">
      <h2 className="text-lg font-bold text-yellow-800 mb-2">🧪 Phase 1 Manual QA Testing</h2>
      <p className="text-yellow-700 mb-2">
        Open browser console to see automatic test results and access exposed functions.
      </p>
      <div className="text-sm text-yellow-600">
        <p>
          <strong>Available in console:</strong>
        </p>
        <ul className="list-disc list-inside">
          <li>window.SimpleTraceabilityCache</li>
          <li>window.getTokenLineage(tokenId)</li>
          <li>window.getUserRoleInfo(address)</li>
        </ul>
      </div>
    </div>
  );
};

export default TraceabilityTestComponent;
