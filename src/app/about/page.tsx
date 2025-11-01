export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">About Fadi&apos;s Bakery</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                Welcome to Fadi&apos;s Bakery, where tradition meets taste in every bite. Founded with a passion for 
                creating authentic, fresh-baked goods, we&apos;ve been serving our community with the finest breads, 
                pastries, and desserts for years.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Story</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our journey began with a simple dream: to bring the authentic flavors of traditional baking to 
                everyone&apos;s table. Using time-honored recipes passed down through generations, we craft each item 
                with care, attention to detail, and the finest ingredients available.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Makes Us Special</h2>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Fresh ingredients sourced locally whenever possible
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Traditional baking methods combined with modern techniques
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Made fresh daily - nothing sits on our shelves overnight
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Custom orders for special occasions and celebrations
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Commitment to quality and customer satisfaction
                </li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Products</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                From artisanal breads and flaky croissants to decadent cakes and seasonal specialties, 
                we offer a wide variety of baked goods to satisfy every craving. Whether you&apos;re looking 
                for your daily bread or planning something special, we have something for everyone.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">Visit Us Today</h3>
                <p className="text-amber-700">
                  Experience the difference that quality ingredients and traditional craftsmanship make. 
                  We look forward to serving you!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}