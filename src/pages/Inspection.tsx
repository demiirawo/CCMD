import { Navigation } from "@/components/Navigation";

const Inspection = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Inspection</h1>
          <div className="bg-card p-6 rounded-lg border">
            <p className="text-muted-foreground">Inspection page content will go here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inspection;