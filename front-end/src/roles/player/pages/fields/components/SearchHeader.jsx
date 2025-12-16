import { Button } from "../../../../../shared/components/ui";

export default function SearchHeader({ entityTab, setEntityTab, resultCount }) {
     return (
          <>
               <div className="pt-4">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-2xl font-bold text-teal-800">Danh sách sân</h1>
                              <div className="mt-1 h-1.5 w-24 bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent rounded-full" />
                              <p className="text-teal-700 font-semibold mt-2">Dành cho người chơi</p>
                         </div>
                         <div className="hidden md:flex items-center gap-2">
                              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
                                   {resultCount} kết quả
                              </span>
                         </div>
                    </div>
               </div>
               <div className="lg:w-64 pt-4 mb-4">
                    <div className="inline-flex rounded-xl overflow-hidden border border-teal-200 bg-white/80">
                         <Button
                              type="button"
                              onClick={() => setEntityTab("fields")}
                              variant={entityTab === "fields" ? "default" : "outline"}
                              className={`${entityTab === "fields" ? "bg-teal-500 text-white hover:bg-teal-600" : "border-0 text-teal-700 hover:bg-teal-50"} rounded-none px-4 py-2 text-sm font-medium`}
                         >
                              Sân nhỏ
                         </Button>
                         <Button
                              type="button"
                              onClick={() => setEntityTab("complexes")}
                              variant={entityTab === "complexes" ? "default" : "outline"}
                              className={`${entityTab === "complexes" ? "bg-teal-500 text-white hover:bg-teal-600" : "border-l border-teal-200 text-teal-700 hover:bg-teal-50"} rounded-none px-4 py-2 text-sm font-medium`}
                         >
                              Khu vực
                         </Button>
                    </div>
               </div>
          </>
     );
}

