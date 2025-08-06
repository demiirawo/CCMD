import { Navigation } from "@/components/Navigation";
import { ChevronRight } from "lucide-react";
const Inspection = () => {
  const panels = [{
    name: "SAFE",
    rating: "G",
    updated: "06/08/2025"
  }, {
    name: "EFFECTIVE",
    rating: "G",
    updated: "06/08/2025"
  }, {
    name: "RESPONSIVE",
    rating: "G",
    updated: "06/08/2025"
  }, {
    name: "WELL LED",
    rating: "G",
    updated: "06/08/2025"
  }, {
    name: "CARING",
    rating: "G",
    updated: "06/08/2025"
  }];
  return <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Inspection</h1>
          <div className="space-y-4">
            {panels.map((panel, index) => <div key={index} className="bg-green-600 text-white p-6 rounded-lg flex items-center justify-between hover:bg-green-700 transition-colors cursor-pointer">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">{panel.name}</h2>
                  <p className="text-green-100 text-sm">Updated: {panel.updated}</p>
                </div>
                <div className="flex items-center gap-4">
                  
                  <ChevronRight className="h-6 w-6 text-white/80" />
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
};
export default Inspection;