import React, { useState } from 'react';
import { createTimeSlot } from '../shared/services/timeSlots';

export default function TestTimeSlots() {
     const [formData, setFormData] = useState({
          slotName: 'slot1',
          fieldId: '3',
          startTime: '08:30',
          endTime: '10:00'
     });
     const [result, setResult] = useState(null);
     const [loading, setLoading] = useState(false);

     const handleSubmit = async (e) => {
          e.preventDefault();
          setLoading(true);
          setResult(null);

          try {
               const response = await createTimeSlot({
                    slotName: formData.slotName,
                    fieldId: parseInt(formData.fieldId),
                    startTime: formData.startTime,
                    endTime: formData.endTime
               });

               setResult(response);
          } catch (error) {
               setResult({
                    success: false,
                    error: error.message
               });
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="p-8 max-w-2xl mx-auto">
               <h1 className="text-3xl font-bold mb-6">Test TimeSlot API</h1>

               <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-4">Tạo TimeSlot</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium mb-1">Slot Name</label>
                              <input
                                   type="text"
                                   value={formData.slotName}
                                   onChange={(e) => setFormData({ ...formData, slotName: e.target.value })}
                                   className="w-full border rounded px-3 py-2"
                                   required
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium mb-1">Field ID</label>
                              <input
                                   type="number"
                                   value={formData.fieldId}
                                   onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                                   className="w-full border rounded px-3 py-2"
                                   required
                              />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium mb-1">Start Time</label>
                                   <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        required
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium mb-1">End Time</label>
                                   <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        required
                                   />
                              </div>
                         </div>

                         <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:opacity-50"
                         >
                              {loading ? 'Đang tạo...' : 'Tạo TimeSlot'}
                         </button>
                    </form>

                    {/* JSON Preview */}
                    <div className="mt-6 bg-gray-100 p-4 rounded">
                         <h3 className="font-semibold mb-2">JSON sẽ gửi:</h3>
                         <pre className="text-xs overflow-auto">
                              {JSON.stringify({
                                   slotName: formData.slotName,
                                   fieldId: parseInt(formData.fieldId),
                                   startTime: formData.startTime,
                                   endTime: formData.endTime
                              }, null, 2)}
                         </pre>
                    </div>
               </div>

               {/* Result Display */}
               {result && (
                    <div className={`p-6 rounded-lg shadow ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                         <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                              {result.success ? '✅ Thành công!' : '❌ Thất bại!'}
                         </h3>

                         {result.success && result.data && (
                              <div className="text-sm text-green-700">
                                   <p><strong>Slot ID:</strong> {result.data.slotId}</p>
                                   <p><strong>Name:</strong> {result.data.name}</p>
                                   <p><strong>Time:</strong> {result.data.startTime} - {result.data.endTime}</p>
                                   <p><strong>Field ID:</strong> {result.data.fieldId}</p>
                              </div>
                         )}

                         {!result.success && (
                              <p className="text-sm text-red-700">{result.error}</p>
                         )}

                         <div className="mt-4 bg-white p-3 rounded">
                              <h4 className="font-semibold text-sm mb-2">Full Response:</h4>
                              <pre className="text-xs overflow-auto">
                                   {JSON.stringify(result, null, 2)}
                              </pre>
                         </div>
                    </div>
               )}
          </div>
     );
}
