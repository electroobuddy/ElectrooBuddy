import {
  Zap, ArrowRight, Shield, Clock, BadgeDollarSign, HeartHandshake,
  Users, X, Phone, CheckCircle, Loader2, Calendar, MapPin, Wrench,
  AlignLeft, ChevronRight, Star, ShoppingCart, Instagram, Linkedin,
  Mail, ChevronDown, MessageCircle, Award, Smile, ChevronUp,
  SatelliteDish, Tv, Fan, Snowflake, Check, ShoppingBag, Send
} from "lucide-react";


  // const faqs = [
  //   { question: 'How quickly can you respond to service requests?', answer: 'Our average response time is 45 minutes within Ujjain city. For emergency services, we aim to arrive within 30 minutes.' },
  //   { question: 'What are your service charges?', answer: 'We charge a standard diagnostic fee of ₹400 which is waived if you proceed with the repair. Our technicians provide a transparent cost estimate before starting any work.' },
  //   { question: 'Do you offer warranties on repairs?', answer: 'Yes, we offer a 90-day warranty on all repairs and a 1-year warranty on parts we install.' },
  //   { question: 'What payment methods do you accept?', answer: 'We accept cash, UPI payments (PhonePe, Google Pay, Paytm), and credit/debit cards.' },
  //   { question: 'Do you service appliances still under manufacturer warranty?', answer: 'We recommend first contacting the manufacturer for appliances under warranty, as unauthorized repairs may void it. However, we can assist with diagnostics.' }
  // ];
  //   const faqs = [
  //   {
  //     question: 'How quickly can you respond to service requests?',
  //     answer: 'Our average response time is 45 minutes within Ujjain city. For emergency services, we aim to arrive within 30 minutes.'
  //   },
  //   {
  //     question: 'Do you provide late night or emergency services?',
  //     answer: 'Yes, we offer emergency services including late night support. Our technicians are available beyond regular hours for urgent electrical issues.'
  //   },
  //   {
  //     question: 'What are your service charges?',
  //     answer: 'We charge a standard diagnostic fee of ₹400 which is waived if you proceed with the repair. Our technicians provide a transparent cost estimate before starting any work.'
  //   },
  //   {
  //     question: 'Are there extra charges for emergency or night services?',
  //     answer: 'Yes, a small additional fee may apply for late night or emergency visits depending on the time and urgency. All charges are communicated clearly before booking confirmation.'
  //   },
  //   {
  //     question: 'Do you offer warranties on repairs?',
  //     answer: 'Yes, we offer a 90-day warranty on all repairs and a 1-year warranty on parts we install.'
  //   },
  //   {
  //     question: 'What payment methods do you accept?',
  //     answer: 'We accept cash, UPI payments (PhonePe, Google Pay, Paytm), and credit/debit cards.'
  //   },
  //   {
  //     question: 'Can I schedule a service for a specific time?',
  //     answer: 'Yes, you can book services in advance and choose a preferred time slot based on availability.'
  //   },
  //   {
  //     question: 'Do you provide same-day service?',
  //     answer: 'Yes, we offer same-day service for most requests depending on technician availability in your area.'
  //   },
  //   {
  //     question: 'What areas do you currently serve?',
  //     answer: 'We currently serve Ujjain city and nearby areas. Expansion to more cities is coming soon.'
  //   },
  //   {
  //     question: 'Do you service appliances still under manufacturer warranty?',
  //     answer: 'We recommend first contacting the manufacturer for appliances under warranty, as unauthorized repairs may void it. However, we can assist with diagnostics.'
  //   },
  //   {
  //     question: 'Is it safe to book services online?',
  //     answer: 'Yes, our platform is secure and all technicians are verified professionals with proper background checks.'
  //   },
  //   {
  //     question: 'What if I am not satisfied with the service?',
  //     answer: 'Customer satisfaction is our priority. You can contact our support team and we will resolve your issue or arrange a revisit if needed.'
  //   }
  // ];
  export const faqs = [
    {
      question: 'How quickly can you respond to service requests?',
      answer: 'Our average response time is 45 minutes within Ujjain city. For emergency services, we aim to arrive within 30 minutes.'
    },
    {
      question: 'Do you provide late night or emergency services?',
      answer: 'Yes, we offer both emergency and late night services to handle urgent electrical issues anytime you need.'
    },
    {
      question: 'Are there extra charges for emergency or night services?',
      answer: 'Yes, emergency service charges are ₹350 and late night service charges are ₹500. These are fixed additional fees and will be clearly shown before booking.'
    },
    {
      question: 'What are your service charges?',
      answer: 'We charge a standard diagnostic fee of ₹400 which is waived if you proceed with the repair. Our technicians provide a transparent cost estimate before starting any work.'
    },
    {
      question: 'Do you offer warranties on repairs?',
      answer: 'Yes, we offer a 90-day warranty on all repairs and a 1-year warranty on parts we install.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept cash, UPI payments (PhonePe, Google Pay, Paytm), and credit/debit cards.'
    },
    {
      question: 'Can I schedule a service for a specific time?',
      answer: 'Yes, you can book services in advance and choose a preferred time slot based on availability.'
    },
    {
      question: 'Do you provide same-day service?',
      answer: 'Yes, we offer same-day service for most requests depending on technician availability in your area.'
    },
    {
      question: 'What areas do you currently serve?',
      answer: 'We currently serve Ujjain city and nearby areas. Expansion to more cities is coming soon.'
    },
    {
      question: 'Do you service appliances still under manufacturer warranty?',
      answer: 'We recommend first contacting the manufacturer for appliances under warranty, as unauthorized repairs may void it. However, we can assist with diagnostics.'
    },
    {
      question: 'Is it safe to book services online?',
      answer: 'Yes, our platform is secure and all technicians are verified professionals with proper background checks.'
    },
    {
      question: 'What if I am not satisfied with the service?',
      answer: 'Customer satisfaction is our priority. You can contact our support team and we will resolve your issue or arrange a revisit if needed.'
    }
  ];

 export const applianceTips = [
    {
      icon: 'fa-wind',
      bgIcon: 'fa-snowflake',
      label: 'Air conditioner maintenance tips',
      title: '5 Essential AC Maintenance Tips',
      description: 'Keep your air conditioner running efficiently and extend its lifespan with these simple maintenance tips.',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: 'fa-thermometer-half',
      bgIcon: 'fa-tint',
      label: 'Refrigerator energy saving tips',
      title: 'How to Reduce Your Refrigerator\'s Energy Consumption',
      description: 'Simple adjustments can significantly lower your electricity bill while keeping your food fresh.',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: 'fa-shield-alt',
      bgIcon: 'fa-home',
      label: 'Home electrical safety tips',
      title: 'Electrical Safety Tips Every Homeowner Should Know',
      description: 'Protect your home and family from electrical hazards with these important safety measures.',
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  export  const serviceShowcase = [
      {
        icon: Snowflake,
        title: 'AC Repair & Service',
        description: 'Expert AC repair, maintenance, and installation services for all brands',
        features: ['Gas Refilling', 'Deep Cleaning', 'Compressor Repair', 'Installation'],
        color: 'from-blue-400 to-blue-600'
      },
      {
        icon: Tv,
        title: 'TV Mounting & Repair',
        description: 'Professional TV wall mounting and repair services at your doorstep',
        features: ['Wall Mounting', 'Screen Repair', 'Smart TV Setup', 'Cable Management'],
        color: 'from-purple-400 to-purple-600'
      },
      {
        icon: Zap,
        title: 'Electrical Services',
        description: 'Complete electrical solutions including short circuit and wiring',
        features: ['Short Circuit Fix', 'Wiring', 'Panel Upgrade', 'Safety Inspection'],
        color: 'from-yellow-400 to-orange-600'
      },
      {
        icon: Fan,
        title: 'Fan Installation & Repair',
        description: 'Ceiling, table, and exhaust fan installation and repair services',
        features: ['Ceiling Fans', 'Exhaust Fans', 'Speed Control', 'Balancing'],
        color: 'from-green-400 to-green-600'
      },
      {
        icon: SatelliteDish,
        title: 'DTH Setup & Service',
        description: 'DTH installation, realignment, and troubleshooting services',
        features: ['New Installation', 'Signal Setup', 'Cable Routing', 'Channel Issues'],
        color: 'from-indigo-400 to-indigo-600'
      },
      {
        icon: Wrench,
        title: 'Appliance Repair',
        description: 'Repair and maintenance for all home appliances',
        features: ['Refrigerator', 'Washing Machine', 'Microwave', 'Water Purifier'],
        color: 'from-red-400 to-red-600'
      }
    ];