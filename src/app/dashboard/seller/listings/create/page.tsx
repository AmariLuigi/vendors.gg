"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowLeft, ArrowRight, Save, Eye, Gamepad2, Package, DollarSign, Upload, Settings, ImageIcon, VideoIcon, Trash2, RotateCcw, Move, Calendar, Clock, Globe, Shield, Truck, Star } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { PoELeague, PoE2League } from "@/lib/types"
import { useGames, useGameCategories, useGameServers, useGameLeagues } from "@/hooks/useGames"

// Constants for Step 3: Pricing
const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD ($)" },
  { value: "AUD", label: "AUD ($)" },
  { value: "JPY", label: "JPY (¥)" },
];

const auctionDurations = [
  { value: "1h", label: "1 Hour" },
  { value: "6h", label: "6 Hours" },
  { value: "12h", label: "12 Hours" },
  { value: "1d", label: "1 Day" },
  { value: "3d", label: "3 Days" },
  { value: "7d", label: "7 Days" },
];

// Constants for Step 5: Advanced Options
const deliveryTimeOptions = [
  { value: "Instant", label: "Instant Delivery", icon: "⚡" },
  { value: "1h", label: "Within 1 Hour", icon: "🕐" },
  { value: "24h", label: "Within 24 Hours", icon: "📅" },
  { value: "3d", label: "Within 3 Days", icon: "📆" },
];

const regionOptions = [
  { value: "NA", label: "North America" },
  { value: "EU", label: "Europe" },
  { value: "AS", label: "Asia" },
  { value: "OCE", label: "Oceania" },
  { value: "SA", label: "South America" },
  { value: "AF", label: "Africa" },
  { value: "GLOBAL", label: "Global" },
];

const deliveryMethods = [
  "In-game trade",
  "Account transfer",
  "Email delivery",
  "Direct message",
  "Face-to-face meeting",
  "Other (specify in description)",
];

// Form validation schema with comprehensive validation
const listingSchema = z.object({
  // Step 1: Game & Category
  game: z.string({
    message: "Please select a game",
  }),
  server: z.string().optional(),
  league: z.string().optional(),
  poeLeague: z.string().optional(), // For Path of Exile dynamic leagues
  category: z.enum(["Currency", "Items", "Accounts", "Services"], {
    message: "Please select a valid category"
  }),
  subcategory: z.string().min(1, "Please select a subcategory"),
  
  // Step 2: Item Details
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(80, "Title must be less than 80 characters")
    .regex(/^[a-zA-Z0-9\s\-_.,!()]+$/, "Title contains invalid characters"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be less than 2000 characters")
    .refine(val => val.trim().length >= 50, "Description cannot be just whitespace"),
  quantity: z.number()
    .min(1, "Quantity must be at least 1")
    .max(999999, "Quantity cannot exceed 999,999")
    .int("Quantity must be a whole number"),
  rarity: z.enum(["Common", "Rare", "Epic", "Legendary"], {
    message: "Please select a valid rarity"
  }).optional(),
  condition: z.enum(["Mint", "Good", "Fair"], {
    message: "Please select a valid condition"
  }).optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(20, "Tag too long"))
    .max(10, "Maximum 10 tags allowed")
    .optional()
    .default([]),
  
  // Step 3: Pricing
  price: z.number()
    .min(0.01, "Price must be at least $0.01")
    .max(50000, "Price cannot exceed $50,000")
    .multipleOf(0.01, "Price must be in valid currency format"),
  currency: z.string().default("USD"),
  negotiable: z.boolean().default(false),
  minimumPrice: z.number()
    .min(0.01, "Minimum price must be at least $0.01")
    .optional(),
  bulkDiscount: z.boolean().default(false),
  auctionMode: z.boolean().default(false),
  auctionDuration: z.string().optional(),
  
  // Step 4: Media Upload
  images: z.array(z.instanceof(File))
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed")
    .refine(files => files.every(file => file.size <= 5 * 1024 * 1024), "Each image must be less than 5MB")
    .refine(files => files.every(file => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)), "Only JPG, PNG, GIF, and WebP images are allowed"),
  videoProof: z.instanceof(File)
    .optional()
    .refine(file => !file || file.size <= 100 * 1024 * 1024, "Video must be less than 100MB")
    .refine(file => !file || ['video/mp4', 'video/webm', 'video/mov'].includes(file.type), "Only MP4, WebM, and MOV videos are allowed"),
  
  // Step 5: Advanced Options
  deliveryTime: z.enum(["Instant", "1h", "24h", "3d"], {
    message: "Please select a delivery time"
  }),
  deliveryMethod: z.string()
    .min(10, "Please provide more details about delivery method")
    .max(500, "Delivery method description too long"),
  regions: z.array(z.string())
    .min(1, "Please select at least one region")
    .max(7, "Cannot select more than 7 regions"),
  minBuyerRating: z.number()
    .min(0, "Minimum rating cannot be negative")
    .max(5, "Maximum rating is 5")
    .default(0),
  publishLater: z.boolean().default(false),
  autoRelist: z.boolean().default(false),
  scheduledDate: z.string().optional(),
}).refine(data => {
  // Cross-field validation: minimum price should be less than main price
  if (data.negotiable && data.minimumPrice && data.minimumPrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: "Minimum price must be less than the main price",
  path: ["minimumPrice"]
}).refine(data => {
  // Cross-field validation: auction duration required if auction mode is enabled
  if (data.auctionMode && !data.auctionDuration) {
    return false;
  }
  return true;
}, {
  message: "Auction duration is required when auction mode is enabled",
  path: ["auctionDuration"]
}).refine(data => {
  // Cross-field validation: scheduled date required if publish later is enabled
  if (data.publishLater && !data.scheduledDate) {
    return false;
  }
  return true;
}, {
  message: "Scheduled date is required when publish later is enabled",
  path: ["scheduledDate"]
})

// Mock data for games and categories
// Remove hardcoded data - now using database-driven data via hooks
// const popularGames = [...] - replaced by useGames hook
// const gameServers = {...} - replaced by useGameServers hook  
// const gameLeagues = {...} - replaced by useGameLeagues hook
// const categories = [...] - replaced by useGameCategories hook
// const subcategories = {...} - replaced by useGameCategories hook

const rarityOptions = ["Common", "Rare", "Epic", "Legendary"] as const
const conditionOptions = ["Mint", "Good", "Fair"] as const

const popularTags = [
  "Rare", "Limited", "Exclusive", "High Level", "Max Stats", "PvP Ready",
  "PvE Ready", "Collector's Item", "Fast Delivery", "Trusted Seller",
  "Negotiable", "Bulk Available", "Quick Sale", "Best Price"
]

type ListingFormData = z.infer<typeof listingSchema>

export default function CreateListingPage() {
  const steps = [
    { id: "game", title: "Game & Category", icon: Gamepad2, description: "Select your game and item category" },
    { id: "details", title: "Item Details", icon: Package, description: "Describe your item in detail" },
    { id: "pricing", title: "Pricing", icon: DollarSign, description: "Set your price and terms" },
    { id: "media", title: "Media Upload", icon: Upload, description: "Add images and proof videos" },
    { id: "advanced", title: "Advanced Options", icon: Settings, description: "Configure delivery and restrictions" },
  ]

  const [currentStep, setCurrentStep] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  
  const form = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      game: "",
      category: "Currency" as const,
      subcategory: "",
      title: "",
      description: "",
      quantity: 1,
      price: 0,
      currency: "USD",
      negotiable: false,
      bulkDiscount: false,
      auctionMode: false,
      publishLater: false,
      autoRelist: false,
      tags: [],
      regions: [],
      minBuyerRating: 0,
      images: [],
      deliveryTime: "Instant" as const,
      deliveryMethod: "",
    },
  })

  const watchedValues = form.watch()
  const selectedGame = watchedValues.game
  const selectedCategory = watchedValues.category
  
  const { games, loading: gamesLoading, error: gamesError } = useGames()
  const { categories, game: selectedGameData, loading: categoriesLoading, error: categoriesError } = useGameCategories(selectedGame || null)
  const { servers, loading: serversLoading, error: serversError } = useGameServers(selectedGame || null)
  const { leagues, loading: leaguesLoading, error: leaguesError } = useGameLeagues(selectedGame || null)
  
  // Path of Exile leagues state (keeping for backward compatibility with poe2scout API)
  const [poeLeagues, setPoeLeagues] = useState<PoELeague[]>([])
  const [poe2Leagues, setPoe2Leagues] = useState<PoE2League[]>([])
  const [poeLeaguesLoading, setPoeLeaguesLoading] = useState(false)
  const [poeLeaguesError, setPoeLeaguesError] = useState<string | null>(null)
  
  // Media upload state
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // Step 5 state
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState<string>("")
  const isNegotiable = watchedValues.negotiable
  const isAuctionMode = watchedValues.auctionMode
  const publishLater = watchedValues.publishLater
  const completionPercentage = Math.round(((currentStep + 1) / steps.length) * 100)

  // Fetch Path of Exile leagues when Path of Exile is selected
  useEffect(() => {
    const selectedGameData = games.find(g => g.id === selectedGame);
    
    if (selectedGameData?.slug === 'poe') {
      const fetchPoeLeagues = async () => {
        setPoeLeaguesLoading(true)
        setPoeLeaguesError(null)
        try {
          // Mock PoE leagues data
          const leagues = [
            {
              id: "Standard",
              name: "Standard",
              realm: "pc",
              url: "https://www.pathofexile.com/ladders/league/Standard",
              startAt: "2013-01-23T21:00:00Z",
              endAt: null,
              description: "The default game mode.",
              category: { id: "Standard" },
              rules: []
            },
            {
              id: "Hardcore",
              name: "Hardcore",
              realm: "pc",
              url: "https://www.pathofexile.com/ladders/league/Hardcore",
              startAt: "2013-01-23T21:00:00Z",
              endAt: null,
              description: "A character killed in the Hardcore league is moved to the Standard league.",
              category: { id: "Standard" },
              rules: []
            }
          ];
          setPoeLeagues(leagues)
        } catch (error) {
          setPoeLeaguesError('Failed to load Path of Exile leagues')
          console.error('Error fetching PoE leagues:', error)
        } finally {
          setPoeLeaguesLoading(false)
        }
      }
      
      fetchPoeLeagues()
    } else if (selectedGameData?.slug === 'poe2') {
      const fetchPoe2Leagues = async () => {
        setPoeLeaguesLoading(true)
        setPoeLeaguesError(null)
        try {
          // Mock PoE2 leagues data
          const leagues = [
            {
              value: "poe2-standard",
              divinePrice: 150,
              chaosDivinePrice: 0.0067
            },
            {
              value: "poe2-hardcore",
              divinePrice: 200,
              chaosDivinePrice: 0.005
            }
          ];
          setPoe2Leagues(leagues)
        } catch (error) {
          setPoeLeaguesError('Failed to load Path of Exile 2 leagues')
          console.error('Error fetching PoE2 leagues:', error)
        } finally {
          setPoeLeaguesLoading(false)
        }
      }
      
      fetchPoe2Leagues()
    } else {
      // Clear PoE leagues when other games are selected
      setPoeLeagues([])
      setPoe2Leagues([])
      setPoeLeaguesError(null)
    }
  }, [selectedGame, games])

  // Media upload helper functions
  const handleImageUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return isValidType && isValidSize
    })

    if (uploadedImages.length + validFiles.length > 10) {
      alert('Maximum 10 images allowed')
      return
    }

    const newImages = [...uploadedImages, ...validFiles]
    setUploadedImages(newImages)
    form.setValue("images", newImages)

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])
  }, [uploadedImages, form])

  const handleVideoUpload = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file')
      return
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      alert('Video file must be less than 100MB')
      return
    }

    setUploadedVideo(file)
    form.setValue("videoProof", file)

    // Create preview URL
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
    }
    setVideoPreviewUrl(URL.createObjectURL(file))
  }, [form, videoPreviewUrl])

  const removeImage = useCallback((index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index)
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index])
    
    setUploadedImages(newImages)
    setImagePreviewUrls(newPreviewUrls)
    form.setValue("images", newImages)
  }, [uploadedImages, imagePreviewUrls, form])

  const removeVideo = useCallback(() => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
    }
    setUploadedVideo(null)
    setVideoPreviewUrl(null)
    form.setValue("videoProof", undefined)
  }, [videoPreviewUrl, form])

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...uploadedImages]
    const newPreviewUrls = [...imagePreviewUrls]
    
    const [movedImage] = newImages.splice(fromIndex, 1)
    const [movedUrl] = newPreviewUrls.splice(fromIndex, 1)
    
    newImages.splice(toIndex, 0, movedImage)
    newPreviewUrls.splice(toIndex, 0, movedUrl)
    
    setUploadedImages(newImages)
    setImagePreviewUrls(newPreviewUrls)
    form.setValue("images", newImages)
  }, [uploadedImages, imagePreviewUrls, form])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }, [handleImageUpload])

  const onSubmit = async (data: ListingFormData) => {
    try {
      // Get the selected game data
      const selectedGameData = games.find(g => g.id === data.game);
      
      // Validate Path of Exile league selection
      if (selectedGameData?.slug === 'poe' || selectedGameData?.slug === 'poe2') {
        if (!data.poeLeague) {
          form.setError('poeLeague', {
            type: 'required',
            message: `Please select a ${selectedGameData.slug === 'poe2' ? 'Path of Exile 2' : 'Path of Exile'} league`
          })
          return
        }
        
        if (selectedGameData.slug === 'poe') {
          // Verify the selected PoE league is still valid
          const selectedLeague = poeLeagues.find(league => league.id === data.poeLeague)
          if (!selectedLeague) {
            form.setError('poeLeague', {
              type: 'invalid',
              message: 'Selected league is no longer available'
            })
            return
          }
          
          // Check if league has ended (only for non-permanent leagues)
          if (selectedLeague.endAt && new Date(selectedLeague.endAt) < new Date()) {
            form.setError('poeLeague', {
              type: 'expired',
              message: 'Selected league has ended'
            })
            return
          }
        } else if (selectedGameData.slug === 'poe2') {
          // Verify the selected PoE2 league is still valid
          const selectedLeague = poe2Leagues.find(league => league.value === data.poeLeague)
          if (!selectedLeague) {
            form.setError('poeLeague', {
              type: 'invalid',
              message: 'Selected league is no longer available'
            })
            return
          }
        }
      }
      
      console.log("Form submitted:", data)
      // TODO: Implement actual submission logic
    } catch (error) {
      console.error("Submission error:", error)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
      form.setValue("tags", newTags)
      setCustomTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove)
    setSelectedTags(newTags)
    form.setValue("tags", newTags)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsPreviewMode(!isPreviewMode)}>
            <Eye className="h-4 w-4" />
            {isPreviewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold">Create New Listing</h1>
        <p className="text-muted-foreground mt-2">
          List your gaming items, currency, accounts, or services on the marketplace
        </p>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div 
        className="mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}% Complete</span>
            </div>
            <Progress value={completionPercentage} className="mb-4" />
            
            {/* Step Navigation */}
            <div className="flex flex-wrap gap-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                  <Button
                    key={step.id}
                    variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => goToStep(index)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={steps[currentStep].id} className="w-full">
            {/* Step 1: Game & Category */}
            <TabsContent value="game" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5" />
                    Game & Category Selection
                  </CardTitle>
                  <CardDescription>
                    Choose the game and category for your listing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Game Selection */}
                  <FormField
                    control={form.control}
                    name="game"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a game" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gamesLoading ? (
                              <SelectItem value="loading" disabled>Loading games...</SelectItem>
                            ) : gamesError ? (
                              <SelectItem value="error" disabled>Error loading games</SelectItem>
                            ) : (
                              games.map((game) => (
                                <SelectItem key={game.id} value={game.id.toString()}>
                                  {game.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the game for your listing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Server Selection (Conditional) */}
                  {selectedGame && games.find(g => g.id === selectedGame)?.hasServers && (
                    <FormField
                      control={form.control}
                      name="server"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Server</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a server" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serversLoading ? (
                              <SelectItem value="loading" disabled>Loading servers...</SelectItem>
                            ) : serversError ? (
                              <SelectItem value="error" disabled>Error loading servers</SelectItem>
                              ) : (
                                servers.map((server) => (
                                  <SelectItem key={server.id} value={server.name}>
                                    {server.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the server for this item
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* League Selection (Conditional) */}
                  {selectedGame && games.find(g => g.id === selectedGame)?.hasLeagues && (
                    <FormField
                      control={form.control}
                      name={(() => {
                        const game = games.find(g => g.id === selectedGame);
                        return (game?.slug === 'poe' || game?.slug === 'poe2') ? 'poeLeague' : 'league';
                      })()}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>League/Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={(() => {
                            const game = games.find(g => g.id === selectedGame);
                            return (game?.slug === 'poe' || game?.slug === 'poe2') && poeLeaguesLoading;
                          })()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={(() => {
                                  const game = games.find(g => g.id === selectedGame);
                                  return (game?.slug === 'poe' || game?.slug === 'poe2') && poeLeaguesLoading 
                                    ? "Loading leagues..." 
                                    : "Select a league or mode";
                                })()} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(() => {
                                const game = games.find(g => g.id === selectedGame);
                                if (game?.slug === 'poe') {
                                  // Dynamic Path of Exile leagues
                                  return poeLeagues.length > 0 ? (
                                    poeLeagues.map((league, index) => (
                                      <SelectItem key={`${league.id}-${index}`} value={league.id}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{league.name}</span>
                                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                            <span>{league.description}</span>
                                            <div className="flex gap-2">
                                              {league.startAt && (
                                                <span>Started: {new Date(league.startAt).toLocaleDateString()}</span>
                                              )}
                                              {league.endAt ? (
                                                <span>Ends: {new Date(league.endAt).toLocaleDateString()}</span>
                                              ) : (
                                                <span className="text-green-600 font-medium">Permanent</span>
                                              )}
                                            </div>
                                            {league.rules.length > 0 && (
                                              <div className="flex gap-1 flex-wrap">
                                                {league.rules.map((rule) => (
                                                  <span key={rule.id} className="bg-muted px-1 rounded text-xs">
                                                    {rule.name}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : poeLeaguesError ? (
                                    <SelectItem value="error" disabled>
                                      {poeLeaguesError}
                                    </SelectItem>
                                  ) : (
                                    <SelectItem value="loading" disabled>
                                      Loading leagues...
                                    </SelectItem>
                                  );
                                } else if (game?.slug === 'poe2') {
                                  // Dynamic Path of Exile 2 leagues from poe2scout.com
                                  return poe2Leagues.length > 0 ? (
                                    poe2Leagues.map((league, index) => (
                                      <SelectItem key={`${league.value}-${index}`} value={league.value}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{league.value}</span>
                                          <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span>Divine: {league.divinePrice.toFixed(1)}</span>
                                            <span>Chaos/Divine: {league.chaosDivinePrice.toFixed(1)}</span>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : poeLeaguesError ? (
                                    <SelectItem value="error" disabled>
                                      {poeLeaguesError}
                                    </SelectItem>
                                  ) : (
                                    <SelectItem value="loading" disabled>
                                      Loading leagues...
                                    </SelectItem>
                                  );
                                } else {
                                  // Database leagues for other games
                                  return leaguesLoading ? (
                                    <SelectItem value="loading" disabled>Loading leagues...</SelectItem>
                                  ) : leaguesError ? (
                                    <SelectItem value="error" disabled>Error loading leagues</SelectItem>
                                  ) : (
                                    leagues.map((league) => (
                                      <SelectItem key={league.id} value={league.name}>
                                        {league.name}
                                      </SelectItem>
                                    ))
                                  );
                                }
                              })()}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {(() => {
                              const selectedGameData = games.find(g => g.id === selectedGame);
                              return (selectedGameData?.slug === 'poe' || selectedGameData?.slug === 'poe2')
                                ? `Select an active ${selectedGameData?.slug === 'poe2' ? 'Path of Exile 2' : 'Path of Exile'} league` 
                                : "Select the league or game mode";
                            })()}
                          </FormDescription>
                          {(() => {
                            const selectedGameData = games.find(g => g.id === selectedGame);
                            return (selectedGameData?.slug === 'poe' || selectedGameData?.slug === 'poe2') && poeLeaguesError && (
                              <p className="text-sm text-destructive mt-1">{poeLeaguesError}</p>
                            );
                          })()}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Category Selection */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                            ) : categoriesError ? (
                              <SelectItem value="error" disabled>Error loading categories</SelectItem>
                            ) : (
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.slug}>
                                  {category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          What type of item are you selling?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Subcategory Selection */}
                  {selectedCategory && (
                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a subcategory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoriesLoading ? (
                                <SelectItem value="loading" disabled>Loading subcategories...</SelectItem>
                              ) : categoriesError ? (
                                <SelectItem value="error" disabled>Error loading subcategories</SelectItem>
                              ) : (
                                (() => {
                                  const selectedCategoryData = categories.find(c => c.slug === selectedCategory);
                                  return selectedCategoryData?.subcategories?.map((subcategory) => (
                                    <SelectItem key={subcategory.id} value={subcategory.slug}>
                                      {subcategory.name}
                                    </SelectItem>
                                  )) || [];
                                })()
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Be more specific about your item type
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: Item Details */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Item Details
                  </CardTitle>
                  <CardDescription>
                    Provide detailed information about your item
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title Input */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a descriptive title for your item"
                            {...field}
                            maxLength={80}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/80 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description Textarea */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a detailed description of your item, including its stats, condition, and any special features..."
                            className="min-h-[120px]"
                            {...field}
                            maxLength={2000}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/2000 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quantity Input */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            How many items?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rarity Select */}
                    <FormField
                      control={form.control}
                      name="rarity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rarity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rarity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rarityOptions.map((rarity) => (
                                <SelectItem key={rarity} value={rarity}>
                                  {rarity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Condition Select */}
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {conditionOptions.map((condition) => (
                                <SelectItem key={condition} value={condition}>
                                  {condition}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel>Tags</FormLabel>
                      <FormDescription>
                        Add tags to help buyers find your item (max 10 tags)
                      </FormDescription>
                    </div>

                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Popular Tags */}
                    <div>
                      <p className="text-sm font-medium mb-2">Popular Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map((tag) => (
                          <Button
                            key={tag}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-auto py-1 px-2"
                            onClick={() => addTag(tag)}
                            disabled={selectedTags.includes(tag) || selectedTags.length >= 10}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Tag Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom tag"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag(customTag)
                          }
                        }}
                        disabled={selectedTags.length >= 10}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTag(customTag)}
                        disabled={!customTag || selectedTags.includes(customTag) || selectedTags.length >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 3: Pricing */}
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing & Terms
                  </CardTitle>
                  <CardDescription>
                    Set your price and negotiation terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price and Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="50000"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Set your asking price
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "USD"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencyOptions.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Negotiable Switch */}
                  <FormField
                    control={form.control}
                    name="negotiable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Price Negotiable
                          </FormLabel>
                          <FormDescription>
                            Allow buyers to make offers below your asking price
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Minimum Price (Conditional) */}
                  {isNegotiable && (
                    <FormField
                      control={form.control}
                      name="minimumPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Acceptable Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            The lowest price you'll accept for this item
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Bulk Discount Switch */}
                  <FormField
                    control={form.control}
                    name="bulkDiscount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Bulk Discount Available
                          </FormLabel>
                          <FormDescription>
                            Offer discounts for larger quantity purchases
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Auction Mode Switch */}
                  <FormField
                    control={form.control}
                    name="auctionMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Auction Mode
                          </FormLabel>
                          <FormDescription>
                            Let buyers bid on your item with a time limit
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Auction Duration (Conditional) */}
                  {isAuctionMode && (
                    <FormField
                      control={form.control}
                      name="auctionDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auction Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select auction duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {auctionDurations.map((duration) => (
                                <SelectItem key={duration.value} value={duration.value}>
                                  {duration.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How long should the auction run?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Price Suggestion Card */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Price Suggestion</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Based on similar items, we suggest pricing between $15.00 - $25.00
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" type="button">
                              Use $15.00
                            </Button>
                            <Button variant="outline" size="sm" type="button">
                              Use $20.00
                            </Button>
                            <Button variant="outline" size="sm" type="button">
                              Use $25.00
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 4: Media Upload */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media Upload</CardTitle>
                  <CardDescription>
                    Upload images and video proof to showcase your item
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-base font-medium">Images (Required)</label>
                      <span className="text-sm text-muted-foreground">
                        {uploadedImages.length}/10 images
                      </span>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragOver
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium">
                          Drag & drop images here, or{' '}
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            browse files
                          </button>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, GIF up to 5MB each (max 10 images)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      />
                    </div>

                    {/* Image Preview Grid */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                              <img
                                src={imagePreviewUrls[index]}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => reorderImages(index, Math.max(0, index - 1))}
                                disabled={index === 0}
                              >
                                <Move className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeImage(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {index === 0 && (
                              <Badge className="absolute top-2 left-2 bg-primary">
                                Main
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-base font-medium">Video Proof (Optional)</label>
                      {uploadedVideo && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeVideo}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Video
                        </Button>
                      )}
                    </div>

                    {!uploadedVideo ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                        <VideoIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                        <div className="space-y-2">
                          <p className="font-medium">
                            Upload video proof{' '}
                            <button
                              type="button"
                              className="text-primary hover:underline"
                              onClick={() => videoInputRef.current?.click()}
                            >
                              browse files
                            </button>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            MP4, MOV, AVI up to 100MB
                          </p>
                        </div>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                        />
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <VideoIcon className="h-8 w-8 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">{uploadedVideo.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        {videoPreviewUrl && (
                          <video
                            src={videoPreviewUrl}
                            controls
                            className="w-full mt-4 rounded-lg max-h-64"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📸 Photo Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use good lighting and clear backgrounds</li>
                      <li>• Show multiple angles of your item</li>
                      <li>• Include close-ups of important details</li>
                      <li>• First image will be used as the main thumbnail</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* Step 5: Advanced Options */}
          <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Options
                  </CardTitle>
                  <CardDescription>
                    Configure delivery, restrictions, and scheduling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Settings
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deliveryTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select delivery time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {deliveryTimeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <span className="flex items-center gap-2">
                                      <span>{option.icon}</span>
                                      {option.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minBuyerRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              Minimum Buyer Rating
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                placeholder="0.0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Only buyers with this rating or higher can purchase
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Method</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe how you will deliver this item (e.g., in-game trade, account transfer, etc.)"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Be specific about the delivery process to build buyer confidence
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t my-6"></div>

                  {/* Regional Restrictions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Regional Availability
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="regions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Regions</FormLabel>
                          <FormDescription>
                            Select regions where this item can be delivered
                          </FormDescription>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            {regionOptions.map((region) => (
                              <div key={region.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={region.value}
                                  checked={selectedRegions.includes(region.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newRegions = [...selectedRegions, region.value]
                                      setSelectedRegions(newRegions)
                                      field.onChange(newRegions)
                                    } else {
                                      const newRegions = selectedRegions.filter(r => r !== region.value)
                                      setSelectedRegions(newRegions)
                                      field.onChange(newRegions)
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor={region.value} className="text-sm">
                                  {region.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t my-6"></div>

                  {/* Scheduling Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Scheduling Options
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="publishLater"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Schedule Publishing
                              </FormLabel>
                              <FormDescription>
                                Publish this listing at a later date
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autoRelist"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Auto Re-list
                              </FormLabel>
                              <FormDescription>
                                Automatically re-list if expired
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {publishLater && (
                      <div className="space-y-2">
                        <label htmlFor="scheduledDate" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Scheduled Date & Time
                        </label>
                        <Input
                          id="scheduledDate"
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Your listing will be published at the specified date and time
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t my-6"></div>

                  {/* Security & Trust */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Trust
                    </h3>
                    
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Seller Protection</h4>
                              <p className="text-sm text-muted-foreground">
                                Your listing is protected by our secure transaction system
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Rating System</h4>
                              <p className="text-sm text-muted-foreground">
                                Build trust with buyers through our rating system
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Delivery Tracking</h4>
                              <p className="text-sm text-muted-foreground">
                                Track delivery status and maintain communication
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Step {currentStep + 1} of {steps.length}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {steps[currentStep].description}
                  </span>
                </div>

                {currentStep === steps.length - 1 ? (
                  <Button type="submit" className="gap-2">
                    Publish Listing
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
      </motion.div>
    </div>
  )
}