import { useState } from 'react';
import { runAllTests } from '../../../../../shared/utils/corsTest';
import { fetchPosts } from '../../../../../shared/services/posts';

export default function CorsDebugPanel() {
     const [testResults, setTestResults] = useState(null);
     const [isLoading, setIsLoading] = useState(false);
     const [postsTest, setPostsTest] = useState(null);

     const runTests = async () => {
          setIsLoading(true);
          try {
               console.log('🧪 Starting CORS and API tests...');

               // Test 1: Basic connectivity and CORS
               const results = await runAllTests();
               setTestResults(results);

               // Test 2: Actual posts API call
               try {
                    console.log('🧪 Testing fetchPosts API call...');
                    const posts = await fetchPosts();
                    setPostsTest({
                         success: true,
                         postsCount: posts?.length || 0,
                         error: null
                    });
                    console.log('✅ fetchPosts successful:', posts?.length || 0, 'posts');
               } catch (error) {
                    setPostsTest({
                         success: false,
                         postsCount: 0,
                         error: error.message
                    });
                    console.error('❌ fetchPosts failed:', error);
               }

          } catch (error) {
               console.error('❌ Test failed:', error);
               setTestResults({
                    summary: {
                         status: 'ERROR',
                         message: error.message
                    }
               });
          } finally {
               setIsLoading(false);
          }
     };

     const getStatusColor = (status) => {
          switch (status) {
               case 'SUCCESS': return 'text-green-600 bg-green-50';
               case 'BACKEND_DOWN': return 'text-orange-600 bg-orange-50';
               case 'CORS_ERROR': return 'text-red-600 bg-red-50';
               default: return 'text-gray-600 bg-gray-50';
          }
     };

     return (
          <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto">
               <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">CORS Debug Panel</h3>
                    <button
                         onClick={runTests}
                         disabled={isLoading}
                         className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                         {isLoading ? 'Testing...' : 'Run Tests'}
                    </button>
               </div>

               {testResults && (
                    <div className="space-y-3">
                         {/* Summary */}
                         <div className={`p-2 rounded text-xs ${getStatusColor(testResults.summary?.status)}`}>
                              <div className="font-medium">{testResults.summary?.status}</div>
                              <div>{testResults.summary?.message}</div>
                         </div>

                         {/* Public API Test */}
                         <div className="border-t pt-2">
                              <div className="text-xs font-medium text-gray-600 mb-1">Public API (GET /api/Post):</div>
                              <div className={`text-xs ${testResults.publicApi?.success ? 'text-green-600' : 'text-red-600'}`}>
                                   {testResults.publicApi?.success ? '✅ Connected' : '❌ Failed'}
                              </div>
                              {testResults.publicApi?.error && (
                                   <div className="text-xs text-red-500 mt-1">
                                        {testResults.publicApi.error}
                                   </div>
                              )}
                              {testResults.publicApi?.details?.errorType && (
                                   <div className="text-xs text-gray-500">
                                        Type: {testResults.publicApi.details.errorType}
                                   </div>
                              )}
                              {testResults.publicApi?.success && (
                                   <div className="text-xs text-gray-500">
                                        Status: {testResults.publicApi.details.status} |
                                        Data: {testResults.publicApi.details.dataType}
                                        {testResults.publicApi.details.dataLength !== null && ` (${testResults.publicApi.details.dataLength} items)`}
                                   </div>
                              )}
                         </div>

                         {/* Authenticated API Test */}
                         <div className="border-t pt-2">
                              <div className="text-xs font-medium text-gray-600 mb-1">Auth API (GET /api/Post/newsfeed):</div>
                              <div className="text-xs space-y-1">
                                   <div>Token: {testResults.authenticatedApi?.hasToken ? '✅ Present' : '❌ Missing'}</div>
                                   <div>Valid: {testResults.authenticatedApi?.tokenValid ? '✅ Yes' : '❌ No'}</div>
                                   <div className={`${testResults.authenticatedApi?.success ? 'text-green-600' :
                                        testResults.authenticatedApi?.details?.expectedError ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {testResults.authenticatedApi?.success ? '✅ Connected' :
                                             testResults.authenticatedApi?.details?.expectedError ? '⚠️ Expected 401' : '❌ Failed'}
                                   </div>
                              </div>
                              {testResults.authenticatedApi?.error && !testResults.authenticatedApi?.details?.expectedError && (
                                   <div className="text-xs text-red-500 mt-1">
                                        {testResults.authenticatedApi.error}
                                   </div>
                              )}
                         </div>

                         {/* Posts API Test (through axios) */}
                         {postsTest && (
                              <div className="border-t pt-2">
                                   <div className="text-xs font-medium text-gray-600 mb-1">Axios Posts API:</div>
                                   <div className={`text-xs ${postsTest.success ? 'text-green-600' : 'text-red-600'}`}>
                                        {postsTest.success ? `✅ ${postsTest.postsCount} posts loaded` : '❌ Failed'}
                                   </div>
                                   {postsTest.error && (
                                        <div className="text-xs text-red-500 mt-1">
                                             {postsTest.error}
                                        </div>
                                   )}
                              </div>
                         )}

                         {/* CORS Headers */}
                         {testResults.corsOptions?.corsHeaders && Object.keys(testResults.corsOptions.corsHeaders).length > 0 && (
                              <div className="border-t pt-2">
                                   <div className="text-xs font-medium text-gray-600 mb-1">CORS Headers:</div>
                                   <div className="text-xs text-gray-500 space-y-1">
                                        {Object.entries(testResults.corsOptions.corsHeaders).map(([key, value]) => (
                                             <div key={key} className="truncate">
                                                  <span className="font-mono">{key}:</span> {value}
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         )}

                         {/* API URL */}
                         <div className="border-t pt-2">
                              <div className="text-xs font-medium text-gray-600 mb-1">API URL:</div>
                              <div className="text-xs text-gray-500 font-mono break-all">
                                   {testResults.summary?.apiUrl}
                              </div>
                         </div>
                    </div>
               )}

               {!testResults && !isLoading && (
                    <div className="text-xs text-gray-500 text-center py-4">
                         Click "Run Tests" để kiểm tra CORS và API connectivity
                         <div className="mt-2 text-xs text-gray-400">
                              Sẽ test cả public APIs và authenticated APIs
                         </div>
                    </div>
               )}
          </div>
     );
}