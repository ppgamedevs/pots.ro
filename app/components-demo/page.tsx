"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/modal";
import { H1, H2, H3, P, Lead, Large, Small, Muted } from "@/components/ui/typography";
import { stagger, fadeInUp } from "@/components/motion";

export default function ComponentsDemo() {
  const [isChecked, setIsChecked] = useState(false);
  const [isSwitched, setIsSwitched] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");

  return (
    <TooltipProvider>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <H1>UI Components Demo</H1>
            <Lead>Accesibile, moderne și gata pentru producție</Lead>
          </div>

          {/* Typography Scale */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <H2>Typography Scale</H2>
            <div className="space-y-4">
              <H1>Heading 1 - Main Title</H1>
              <H2>Heading 2 - Section Title</H2>
              <H3>Heading 3 - Subsection</H3>
              <P>
                This is a paragraph with normal text. It demonstrates the default paragraph styling
                with proper line height and spacing.
              </P>
              <Lead>This is a lead paragraph with larger text and different color.</Lead>
              <Large>Large text for emphasis</Large>
              <Small>Small text for captions</Small>
              <Muted>Muted text for secondary information</Muted>
            </div>
          </motion.section>

          {/* Form Components */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <H2>Form Components</H2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Enter your message" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ro">Romania</SelectItem>
                      <SelectItem value="md">Moldova</SelectItem>
                      <SelectItem value="bg">Bulgaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Checkbox Options</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={isChecked}
                      onCheckedChange={setIsChecked}
                    />
                    <Label htmlFor="terms">Accept terms and conditions</Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Radio Options</Label>
                  <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="option1" />
                      <Label htmlFor="option1">Option 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="option2" />
                      <Label htmlFor="option2">Option 2</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Switch</Label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="notifications"
                      checked={isSwitched}
                      onCheckedChange={setIsSwitched}
                    />
                    <Label htmlFor="notifications">Enable notifications</Label>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Button Variants */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <H2>Button Variants</H2>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </motion.section>

          {/* Feedback Components */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <H2>Feedback Components</H2>
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>This is a default alert message.</AlertDescription>
              </Alert>
              <Alert variant="success">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Operation completed successfully!</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>Please check your input before proceeding.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Something went wrong. Please try again.</AlertDescription>
              </Alert>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </motion.section>

          {/* Interactive Components */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <H2>Interactive Components</H2>
            <div className="flex flex-wrap gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover for tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a helpful tooltip</p>
                </TooltipContent>
              </Tooltip>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Modal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modal Title</DialogTitle>
                    <DialogDescription>
                      This is a modal dialog with proper focus management and accessibility.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Modal content goes here...</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.section>

          {/* Loading States */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            <H2>Loading States</H2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </main>
      <Footer />
    </TooltipProvider>
  );
}
