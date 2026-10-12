 {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">ElectrooBuddy</span>
              <p className="mt-4 mb-4">India's trusted appliance care and repair service with 30+ years of experience.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition duration-300"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition duration-300"><Linkedin className="h-5 w-5" /></a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-blue-600 dark:hover:text-white transition duration-300">Home</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-blue-600 dark:hover:text-white transition duration-300">About Us</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-blue-600 dark:hover:text-white transition duration-300">Services</button></li>
                <li><button onClick={() => scrollToSection('gallery')} className="hover:text-blue-600 dark:hover:text-white transition duration-300">Gallery</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-blue-600 dark:hover:text-white transition duration-300">Testimonials</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-blue-600 dark:hover:text-white transition duration-300">Contact</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Our Services</h3>
              <ul className="space-y-2">
                <li><a href="#request-service" className="hover:text-blue-600 dark:hover:text-white transition duration-300">DTH Installation</a></li>
                <li><a href="#request-service" className="hover:text-blue-600 dark:hover:text-white transition duration-300">TV Installation</a></li>
                <li><a href="#request-service" className="hover:text-blue-600 dark:hover:text-white transition duration-300">Electrical Repairs</a></li>
                <li><a href="#request-service" className="hover:text-blue-600 dark:hover:text-white transition duration-300">Fan Installation</a></li>
                <li><a href="#request-service" className="hover:text-blue-600 dark:hover:text-white transition duration-300">AC Maintenance</a></li>
                <li><a href="#request-service" className="hover:text-blue-600 dark:hover:text-white transition duration-300">Appliance Repairs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Info</h3>
              <address className="not-italic">
                <p className="mb-2"><a href="https://maps.app.goo.gl/qZrUyCPzpVnVuGUq8" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-white transition duration-300 inline-flex items-start group"><MapPin className="mr-2 mt-1 text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-white transition duration-300 h-4 w-4" />Pragya Electric Work Shop,<br />Ujjain, MP 456010</a></p>
                <p className="mb-2"><a href={`tel:${PHONE_NUMBER}`} className="hover:text-blue-600 dark:hover:text-white transition duration-300 inline-flex items-center group"><Phone className="mr-2 text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-white transition duration-300 h-4 w-4" />+91 70003 95039</a></p>
                <p className="mb-2"><a href="mailto:info@electroobuddy.com" className="hover:text-blue-600 dark:hover:text-white transition duration-300 inline-flex items-center group"><Mail className="mr-2 text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-white transition duration-300 h-4 w-4" />info@electroobuddy.com</a></p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-300 dark:border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2026 ElectrooBuddy. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition duration-300">Privacy Policy</a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition duration-300">Terms of Service</a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition duration-300">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>