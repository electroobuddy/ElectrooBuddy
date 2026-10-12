import { sanitizeRichText } from "@/lib/security";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Section from "@/components/Section";
import SEO from "@/components/SEO";

const Tips = () => {
  const tips = [
    {
      id: 1,
      icon: 'fa-wind',
      bgIcon: 'fa-snowflake',
      label: 'Air conditioner maintenance tips',
      title: '5 Essential AC Maintenance Tips',
      description: 'Keep your air conditioner running efficiently and extend its lifespan with these simple maintenance tips.',
      color: 'text-blue-600 dark:text-blue-400',
      content: `
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">5 Essential AC Maintenance Tips</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Regular maintenance of your air conditioner not only ensures efficient cooling but also extends its lifespan and reduces energy bills. Here are five essential tips:</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">1. Clean or Replace Filters Monthly</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Dirty filters restrict airflow and reduce efficiency. During peak cooling season, check filters monthly and replace or clean them as needed.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">2. Clean the Condenser Coils</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">The condenser coils release heat from your home. Keep them clean by gently brushing away debris and rinsing with a garden hose (power off first).</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">3. Check and Clean Fins</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Aluminum fins on evaporator and condenser coils can bend and block airflow. Use a fin comb to straighten any bent fins.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">4. Ensure Proper Drainage</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Check that drain channels are clear. A clogged drain can cause water damage and increase humidity in your home.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">5. Schedule Professional Service Annually</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Have a qualified technician service your AC at least once a year to check refrigerant levels, test for leaks, and perform thorough cleaning.</p>
        
        <div class="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
          <p class="text-blue-800 dark:text-blue-300 font-medium">Pro Tip: Turn off your AC 30 minutes before leaving home to save energy while maintaining comfort.</p>
        </div>
      `,
      date: 'March 15, 2024',
      readTime: '5 min read'
    },
    {
      id: 2,
      icon: 'fa-thermometer-half',
      bgIcon: 'fa-tint',
      label: 'Refrigerator energy saving tips',
      title: 'How to Reduce Your Refrigerator\'s Energy Consumption',
      description: 'Simple adjustments can significantly lower your electricity bill while keeping your food fresh.',
      color: 'text-blue-600 dark:text-blue-400',
      content: `
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">How to Reduce Your Refrigerator's Energy Consumption</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Your refrigerator runs 24/7, making it one of the biggest energy consumers in your home. These simple strategies can significantly reduce its energy usage:</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">1. Set Optimal Temperature</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Keep your refrigerator at 35-38°F (2-4°C) and freezer at 0°F (-18°C). Every degree colder increases energy use by 2-4%.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">2. Check Door Seals</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Test seals by closing the door on a dollar bill. If it slips out easily, replace the gasket. Leaky seals can increase energy use by 20%.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">3. Don't Overfill or Underfill</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">A well-stocked fridge retains cold better, but don't block air vents. For freezers, fuller is better - frozen items help keep each other cold.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">4. Let Food Cool First</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Never put hot food directly in the fridge. Let it cool to room temperature first to avoid making the compressor work harder.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">5. Clean Condenser Coils</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Dusty coils make your fridge work harder. Vacuum or brush coils every 6 months, located either on the back or beneath the front grille.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">6. Minimize Door Openings</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Decide what you need before opening the door. Each opening lets cold air escape, forcing the compressor to run longer.</p>
        
        <div class="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
          <p class="text-blue-800 dark:text-blue-300 font-medium">Energy Savings: These tips can reduce your refrigerator's energy consumption by up to 30%, saving you ₹2,000-₹5,000 annually.</p>
        </div>
      `,
      date: 'March 12, 2024',
      readTime: '6 min read'
    },
    {
      id: 3,
      icon: 'fa-shield-alt',
      bgIcon: 'fa-home',
      label: 'Home electrical safety tips',
      title: 'Electrical Safety Tips Every Homeowner Should Know',
      description: 'Protect your home and family from electrical hazards with these important safety measures.',
      color: 'text-blue-600 dark:text-blue-400',
      content: `
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Electrical Safety Tips Every Homeowner Should Know</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Electrical hazards are a leading cause of home fires and injuries. Follow these essential safety practices to protect your family and property:</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">1. Know Your Circuit Breaker Panel</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Label all circuits clearly and know how to reset them. Test GFCI outlets monthly by pressing the "Test" and "Reset" buttons.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">2. Don't Overload Outlets</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Avoid using multiple high-wattage appliances on the same circuit. Never daisy-chain power strips or use extension cords as permanent wiring.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">3. Watch for Warning Signs</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Flickering lights, warm outlets, burning smells, or frequently tripped breakers indicate serious problems. Call a professional immediately.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">4. Keep Water Away from Electricity</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Install GFCI outlets in kitchens, bathrooms, garages, and outdoor areas. Never use electrical devices near water sources.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">5. Childproof Your Outlets</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Use tamper-resistant outlets or outlet covers in homes with young children. Teach kids never to insert objects into outlets.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">6. Regular Inspections</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Have a licensed electrician inspect your home's electrical system every 10 years, or when buying an older home.</p>
        
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">7. Update Old Wiring</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">Homes over 40 years old may have outdated wiring that can't handle modern electrical loads. Consider upgrading to meet current codes.</p>
        
        <div class="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-600">
          <p class="text-red-800 dark:text-red-300 font-medium">Emergency: If you smell burning or see sparks, turn off power at the main breaker and call an electrician immediately.</p>
        </div>
      `,
      date: 'March 10, 2024',
      readTime: '7 min read'
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <SEO
        title="Appliance Care Tips & Electrical Safety Guide | ElectrooBuddy"
        description="Expert tips on appliance maintenance, energy saving, and electrical safety. Learn how to extend the life of your appliances and keep your home safe."
        canonical="/tips"
      />

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20 slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Appliance Care & Safety Tips</h1>
          <p className="text-xl max-w-3xl mx-auto opacity-90">
            Expert advice to help you maintain your appliances, save energy, and keep your home safe
          </p>
        </div>
      </section>

      {/* Tips Grid */}
      <Section>
        <div className="grid grid-cols-1 gap-12">
          {tips.map((tip) => (
            <div key={tip.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition duration-300 hover:shadow-xl">
              <div className="md:flex">
                <div className="md:w-1/3 bg-blue-50 dark:bg-gray-700 h-64 md:h-auto flex items-center justify-center relative overflow-hidden">
                  <i className={`fas ${tip.bgIcon} text-8xl ${tip.color} opacity-20 absolute`}></i>
                  <i className={`fas ${tip.icon} text-7xl ${tip.color} relative z-10`}></i>
                  <span className="absolute top-4 left-4 text-xs text-gray-500 dark:text-gray-400 font-medium">{tip.label}</span>
                </div>
                <div className="p-8 md:w-2/3">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{tip.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{tip.readTime}</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{tip.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">{tip.description}</p>
                  <div 
                    className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(tip.content) }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition duration-300"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Home
          </Link>
        </div>
      </Section>
    </div>
  );
};

export default Tips;
