import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Layers,
} from "lucide-react";

export default function Reports() {
  return (
    <div className="min-h-screen font-sans p-4 py-12">
      <div className="w-full mx-auto rounded-2xl overflow-hidden">
        <div className="p-6 md:p-10">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
            Reports & Analytics
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            View analytics and export data for your inventory.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <BarChart3 className="w-6 h-6 text-[#0f172b] mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Analytics
              </p>
              <p className="text-xs text-gray-500">
                View usage trends and inventory metrics
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <FileText className="w-6 h-6 text-[#0f172b] mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Generate Reports
              </p>
              <p className="text-xs text-gray-500">
                Create custom inventory reports
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Download className="w-6 h-6 text-[#0f172b] mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Export Data
              </p>
              <p className="text-xs text-gray-500">
                Download inventory data as CSV or PDF
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <TrendingUp className="w-6 h-6 text-[#0f172b] mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">Trends</p>
              <p className="text-xs text-gray-500">
                Track changes and patterns over time
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-8 flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-400">
              <Layers className="w-5 h-5" />
              <p className="text-sm">More features coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
