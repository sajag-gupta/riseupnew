import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Heart, 
  Star,
  ShoppingCart,
  Grid3X3,
  List,
  SlidersHorizontal
} from "lucide-react";

export default function MerchStore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch merchandise data
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/merch", searchQuery, selectedCategory, sortBy, priceRange],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/merch/categories"],
  });

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["/api/merch/featured"],
  });

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesPrice = 
      (!priceRange.min || product.price >= Number(priceRange.min)) &&
      (!priceRange.max || product.price <= Number(priceRange.max));
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Merchandise Store</h1>
          <p className="text-ruc-text-muted">
            Shop exclusive merchandise from your favorite artists
          </p>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product: any) => (
                <FeaturedProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ruc-text-low w-5 h-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-ruc-surface border-ruc-border focus:border-ruc-red"
                data-testid="search-input"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-ruc-surface border-ruc-border" data-testid="category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-ruc-surface border-ruc-border">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: string) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-ruc-surface border-ruc-border" data-testid="sort-filter">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-ruc-surface border-ruc-border">
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-ruc-border" data-testid="advanced-filters">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-ruc-text-muted">Price Range:</span>
            <Input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-24 bg-ruc-surface border-ruc-border"
              data-testid="price-min-input"
            />
            <span className="text-ruc-text-muted">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-24 bg-ruc-surface border-ruc-border"
              data-testid="price-max-input"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPriceRange({ min: "", max: "" })}
              className="text-ruc-text-muted hover:text-ruc-red"
              data-testid="clear-price-filter"
            >
              Clear
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-ruc-text-muted">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "red-gradient" : ""}
                data-testid="grid-view-button"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "red-gradient" : ""}
                data-testid="list-view-button"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-ruc-surface border-ruc-border">
                <div className="animate-pulse">
                  <div className="bg-ruc-surface-2 h-48 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="bg-ruc-surface-2 h-4 rounded"></div>
                    <div className="bg-ruc-surface-2 h-3 rounded w-3/4"></div>
                    <div className="bg-ruc-surface-2 h-4 rounded w-1/2"></div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredProducts.map((product: any) => (
              viewMode === "grid" ? (
                <ProductCard key={product.id} product={product} />
              ) : (
                <ProductListItem key={product.id} product={product} />
              )
            ))}
          </div>
        ) : (
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-ruc-text-low mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-ruc-text-muted mb-4">
                Try adjusting your search criteria or browse all products
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setPriceRange({ min: "", max: "" });
                }}
                className="red-gradient"
                data-testid="clear-all-filters"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Featured Product Card Component
function FeaturedProductCard({ product }: { product: any }) {
  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border relative overflow-hidden" data-testid={`featured-product-${product.id}`}>
      <Badge className="absolute top-2 left-2 z-10 bg-ruc-red text-white">
        Featured
      </Badge>
      <img
        src={product.mainImage || "/placeholder-merch.jpg"}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-ruc-text-muted mb-2 line-clamp-2">{product.artist?.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-ruc-red">${product.price}</span>
          <Button size="sm" className="red-gradient" data-testid={`add-to-cart-featured-${product.id}`}>
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Product Card Component (Grid View)
function ProductCard({ product }: { product: any }) {
  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border group" data-testid={`product-card-${product.id}`}>
      <div className="relative">
        <img
          src={product.mainImage || "/placeholder-merch.jpg"}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-ruc-surface/80 hover:bg-ruc-surface"
          data-testid={`like-product-${product.id}`}
        >
          <Heart className="w-4 h-4" />
        </Button>
        {product.inventory?.totalStock === 0 && (
          <Badge className="absolute bottom-2 left-2 bg-ruc-danger text-white">
            Out of Stock
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold truncate">{product.name}</h3>
          <p className="text-sm text-ruc-text-muted">{product.artist?.name}</p>
        </div>
        
        <p className="text-sm text-ruc-text-muted mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold">${product.price}</span>
          {product.averageRating && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.averageRating}</span>
            </div>
          )}
        </div>
        
        <Button
          className="w-full red-gradient hover:shadow-red-glow"
          disabled={product.inventory?.totalStock === 0}
          data-testid={`add-to-cart-${product.id}`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.inventory?.totalStock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Product List Item Component (List View)
function ProductListItem({ product }: { product: any }) {
  return (
    <Card className="bg-ruc-surface border-ruc-border" data-testid={`product-list-${product.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <img
            src={product.mainImage || "/placeholder-merch.jpg"}
            alt={product.name}
            className="w-20 h-20 rounded object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-ruc-text-muted">{product.artist?.name}</p>
                <p className="text-sm text-ruc-text-muted mt-1 line-clamp-2">
                  {product.description}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold mb-2">${product.price}</div>
                {product.averageRating && (
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{product.averageRating}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" data-testid={`like-product-list-${product.id}`}>
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="red-gradient"
                    disabled={product.inventory?.totalStock === 0}
                    data-testid={`add-to-cart-list-${product.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    {product.inventory?.totalStock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
