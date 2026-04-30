import { Star, MapPin, Wifi, Coffee, Waves } from 'lucide-react';
import { motion } from 'motion/react';

interface HotelCardProps {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  imageUrl: string;
  amenities: string[];
  onBook: (hotelId: string) => void;
}

export function HotelCard({
  id,
  name,
  location,
  rating,
  reviews,
  price,
  imageUrl,
  amenities,
  onBook,
}: HotelCardProps) {
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-3 h-3" />;
      case 'breakfast':
        return <Coffee className="w-3 h-3" />;
      case 'pool':
        return <Waves className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
    >
      <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-md flex items-center space-x-1">
          <Star className="w-3 h-3 fill-black dark:fill-white text-black dark:text-white" />
          <span className="font-medium text-xs text-black dark:text-white">{rating}</span>
        </div>
      </div>

      <div className="p-6">
        <h3
          className="text-black dark:text-white text-xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {name}
        </h3>
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{location}</span>
        </div>

        <div className="flex items-center space-x-2 mb-5">
          {amenities.map((amenity, index) => (
            <div
              key={index}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {getAmenityIcon(amenity)}
              <span className="text-xs">{amenity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400 mb-1">เริ่มต้นที่</p>
            <div className="flex items-baseline">
              <span
                className="text-black dark:text-white text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ฿{price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400 ml-1">/คืน</span>
            </div>
          </div>
          <motion.button
            onClick={() => onBook(id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-900 dark:hover:bg-gray-200 transition-all font-medium"
          >
            จองเลย
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
