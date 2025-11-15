import React, { useState, useEffect } from 'react';
import { fetchFieldSchedules, createFieldSchedule, deleteFieldSchedule } from '../shared/services/fieldSchedules';

export default function TestFieldSchedules() {
     const [schedules, setSchedules] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     // Form state
     const [formData, setFormData] = useState({
          fieldId: '',
          slotId: '',
          date: '',
          status: 'available'
     });

     // Load schedules
     const loadSchedules = async () => {
          setLoading(true);
          setError(null);
          try {
               const result = await fetchFieldSchedules();
               if (result.success) {
                    setSchedules(result.data);
                    console.log('Schedules loaded:', result.data);
               } else {
                    setError(result.error);
               }
          } catch (err) {
               setError(err.message);
          } finally {
               setLoading(false);
          }
     };

     // Create schedule
     const handleCreate = async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          try {
               const result = await createFieldSchedule(formData);
               if (result.success) {
                    alert('Tạo lịch trình thành công!');
                    setFormData({ fieldId: '', slotId: '', date: '', status: 'available' });
                    loadSchedules();
               } else {
                    setError(result.error);
               }
          } catch (err) {
               setError(err.message);
          } finally {
               setLoading(false);
          }
     };

     // Delete schedule
     const handleDelete = async (scheduleId) => {
          if (!window.confirm('Bạn có chắc muốn xóa?')) return;
          setLoading(true);
          try {
               const result = await deleteFieldSchedule(scheduleId);
               if (result.success) {
                    alert('Xóa thành công!');
                    loadSchedules();
               } else {
                    setError(result.error);
               }
          } catch (err) {
               setError(err.message);
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          loadSchedules();
     }, []);

     return (
          <div className="p-8 max-w-6xl mx-auto">
               <h1 className="text-3xl font-bold mb-6">Test Field Schedules API</h1>

               {/* Create Form */}
               <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-4">Tạo lịch trình mới</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
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
                              <div>
                                   <label className="block text-sm font-medium mb-1">Slot ID</label>
                                   <input
                                        type="number"
                                        value={formData.slotId}
                                        onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        required
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium mb-1">Date</label>
                                   <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        required
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium mb-1">Status</label>
                                   <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                   >
                                        <option value="available">Available</option>
                                        <option value="booked">Booked</option>
                                        <option value="maintenance">Maintenance</option>
                                   </select>
                              </div>
                         </div>
                         <button
                              type="submit"
                              disabled={loading}
                              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                         >
                              {loading ? 'Đang tạo...' : 'Tạo lịch trình'}
                         </button>
                    </form>
               </div>

               {/* Error Display */}
               {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                         {error}
                    </div>
               )}

               {/* Schedules List */}
               <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-xl font-semibold">Danh sách lịch trình ({schedules.length})</h2>
                         <button
                              onClick={loadSchedules}
                              disabled={loading}
                              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
                         >
                              {loading ? 'Đang tải...' : 'Tải lại'}
                         </button>
                    </div>

                    {loading && <p className="text-gray-500">Đang tải...</p>}

                    {!loading && schedules.length === 0 && (
                         <p className="text-gray-500">Chưa có lịch trình nào</p>
                    )}

                    {!loading && schedules.length > 0 && (
                         <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                   <thead>
                                        <tr className="bg-gray-100">
                                             <th className="border p-2 text-left">ID</th>
                                             <th className="border p-2 text-left">Field ID</th>
                                             <th className="border p-2 text-left">Field Name</th>
                                             <th className="border p-2 text-left">Slot ID</th>
                                             <th className="border p-2 text-left">Slot Name</th>
                                             <th className="border p-2 text-left">Date</th>
                                             <th className="border p-2 text-left">Time</th>
                                             <th className="border p-2 text-left">Status</th>
                                             <th className="border p-2 text-left">Actions</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {schedules.map((schedule) => (
                                             <tr key={schedule.scheduleId} className="hover:bg-gray-50">
                                                  <td className="border p-2">{schedule.scheduleId}</td>
                                                  <td className="border p-2">{schedule.fieldId}</td>
                                                  <td className="border p-2">{schedule.fieldName || '-'}</td>
                                                  <td className="border p-2">{schedule.slotId}</td>
                                                  <td className="border p-2">{schedule.slotName || '-'}</td>
                                                  <td className="border p-2">
                                                       {schedule.date ?
                                                            `${schedule.date.year}-${String(schedule.date.month).padStart(2, '0')}-${String(schedule.date.day).padStart(2, '0')}`
                                                            : '-'}
                                                  </td>
                                                  <td className="border p-2">
                                                       {schedule.startTime && schedule.endTime ?
                                                            `${String(schedule.startTime.hour).padStart(2, '0')}:${String(schedule.startTime.minute).padStart(2, '0')} - ${String(schedule.endTime.hour).padStart(2, '0')}:${String(schedule.endTime.minute).padStart(2, '0')}`
                                                            : '-'}
                                                  </td>
                                                  <td className="border p-2">
                                                       <span className={`px-2 py-1 rounded text-xs ${schedule.status === 'available' ? 'bg-green-100 text-green-800' :
                                                                 schedule.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                                                                      'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {schedule.status}
                                                       </span>
                                                  </td>
                                                  <td className="border p-2">
                                                       <button
                                                            onClick={() => handleDelete(schedule.scheduleId)}
                                                            disabled={loading}
                                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                                                       >
                                                            Xóa
                                                       </button>
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    )}
               </div>

               {/* Debug Info */}
               <div className="mt-6 bg-gray-100 p-4 rounded">
                    <h3 className="font-semibold mb-2">Debug Info:</h3>
                    <pre className="text-xs overflow-auto">
                         {JSON.stringify({ schedules, error }, null, 2)}
                    </pre>
               </div>
          </div>
     );
}
