"use client";
import AboutHero from "@/components/hero/HeroComponent";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/Navbar";
import { Building2, Home, Users, Leaf, Zap, TrendingDown, CheckCircle, Award } from "lucide-react";
import { useState, useEffect } from "react";

export default function OurImpact() {
	// Counter animation hook
	const useCounter = (target: number, duration: number = 2000) => {
		const [count, setCount] = useState(0);

		useEffect(() => {
			let start = 0;
			const increment = target / (duration / 20);
			const interval = setInterval(() => {
				start += increment;
				if (start >= target) {
					start = target;
					clearInterval(interval);
				}
				setCount(Math.floor(start));
			}, 20);

			return () => clearInterval(interval);
		}, [target, duration]);

		return count;
	};

	// Impact metrics
	const businessImpacts = [
		{
			title: "Cost Reduction",
			stat: "45%",
			description: "Average reduction in energy costs for businesses",
			icon: TrendingDown,
		},
		{
			title: "ROI Period",
			stat: "3-5",
			description: "Years average return on investment",
			icon: Award,
		},
		{
			title: "Uptime Guarantee",
			stat: "99%",
			description: "System reliability with IoT monitoring",
			icon: CheckCircle,
		},
	];

	const environmentalMetrics = [
		{
			label: "CO₂ Emissions Reduced",
			value: useCounter(1200),
			suffix: "+ Tons",
			icon: Leaf,
		},
		{
			label: "Trees Equivalent Planted",
			value: useCounter(50000),
			suffix: "+",
			icon: Leaf,
		},
		{
			label: "Clean Energy Generated",
			value: useCounter(2500),
			suffix: "+ MWh",
			icon: Zap,
		},
	];

	const successStories = [
		{
			category: "Commercial",
			title: "Elmer Hotel & Resort",
			impact: "Reduced energy costs by 60% with a 50kW solar installation",
			result: "Payback period of 4 years with ongoing savings",
			image: "/about-1.JPG",
		},
		{
			category: "Residential",
			title: "Ruiru & Kisii Home Initiatives",
			impact: "Powered 100+ homes with clean, reliable solar energy",
			result: "Families save average KES 5,000 monthly on electricity",
			image: "/about-2.JPG",
		},
		{
			category: "Agricultural",
			title: "Sagana Borehole Solarization",
			impact: "Eliminated diesel costs for water pumping",
			result: "24/7 water access with zero operating costs",
			image: "/about-3.JPG",
		},
	];

	const communityBenefits = [
		{
			icon: Building2,
			title: "Job Creation",
			description: "Created employment opportunities for local technicians and installers across East Africa",
		},
		{
			icon: Users,
			title: "Community Training",
			description: "Trained 50+ local technicians through Cytek Solar Academy programs",
		},
		{
			icon: Zap,
			title: "Energy Access",
			description: "Brought reliable electricity to rural communities without grid connectivity",
		},
		{
			icon: Home,
			title: "Quality of Life",
			description: "Improved living standards through affordable, clean energy solutions",
		},
	];

	return (
		<main className="min-h-screen bg-white">
			<Navbar />
			<AboutHero title="Creating " highlight="Lasting Impact" />

			{/* Overview Section */}
			<section className="py-16 md:py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center max-w-3xl mx-auto mb-16">
						<span className="text-[#33B200] font-semibold text-sm uppercase tracking-wider bg-green-50 px-4 py-2 inline-block mb-4">
							Our Impact Story
						</span>
						<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#244672] mb-6">
							Transforming Lives Through Solar Energy
						</h2>
						<p className="text-gray-700 text-lg leading-relaxed">
							Since 2018, Cytek Solar has been at the forefront of Kenya's renewable energy revolution. 
							We've empowered businesses, homes, and communities with sustainable solar solutions that 
							reduce costs, increase energy independence, and protect our environment.
						</p>
					</div>
				</div>
			</section>

			{/* Environmental Impact */}
			<section className="py-16 md:py-20 bg-gradient-to-b from-green-50 to-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-4">
							Environmental Impact
						</h2>
						<p className="text-gray-600 text-lg max-w-2xl mx-auto">
							Our commitment to a cleaner, greener future for Africa
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{environmentalMetrics.map((metric, index) => {
							const Icon = metric.icon;
							return (
								<div
									key={index}
									className="bg-white p-8 border-l-4 border-[#33B200] shadow-lg hover:shadow-xl transition-all duration-300"
								>
									<div className="flex items-center gap-4 mb-4">
										<div className="p-3 bg-gradient-to-br from-[#33B200] to-[#2a8f00] text-white">
											<Icon className="w-6 h-6" />
										</div>
										<p className="text-gray-600 font-semibold text-sm uppercase tracking-wide">
											{metric.label}
										</p>
									</div>
									<div className="text-5xl md:text-6xl font-bold text-[#244672]">
										{metric.value}
										<span className="text-2xl text-[#33B200] ml-2">{metric.suffix}</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Impact on Businesses */}
			<section className="py-16 md:py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<span className="text-[#33B200] font-semibold text-sm uppercase tracking-wider bg-green-50 px-4 py-2 inline-block mb-4">
								Business Impact
							</span>
							<h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-6">
								Empowering Businesses with Reliable Energy
							</h2>
							<p className="text-gray-700 leading-relaxed mb-8 text-lg">
								We've helped businesses across Kenya reduce operational costs, improve reliability, 
								and achieve energy independence. From small enterprises to large industrial facilities, 
								our solar solutions deliver measurable results.
							</p>

							<div className="space-y-4">
								{[
									"Significant reduction in electricity bills",
									"Protection from power outages and grid instability",
									"Enhanced brand reputation through sustainability",
									"Flexible payment plans with lease-to-own options",
									"24/7 IoT monitoring for maximum uptime",
								].map((benefit, index) => (
									<div key={index} className="flex items-start gap-3">
										<CheckCircle className="w-6 h-6 text-[#33B200] flex-shrink-0 mt-0.5" />
										<p className="text-gray-700">{benefit}</p>
									</div>
								))}
							</div>
						</div>

						<div className="grid grid-cols-1 gap-6">
							{businessImpacts.map((impact, index) => {
								const Icon = impact.icon;
								return (
									<div
										key={index}
										className="bg-gray-50 p-6 border border-gray-200 hover:border-[#33B200] hover:shadow-lg transition-all duration-300"
									>
										<div className="flex items-start gap-4">
											<div className="p-3 bg-[#33B200] text-white flex-shrink-0">
												<Icon className="w-6 h-6" />
											</div>
											<div>
												<h3 className="text-3xl font-bold text-[#244672] mb-2">
													{impact.stat}
												</h3>
												<h4 className="font-semibold text-[#244672] mb-1">
													{impact.title}
												</h4>
												<p className="text-gray-600 text-sm">{impact.description}</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			{/* Impact on Homes */}
			<section className="py-16 md:py-20 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div className="order-2 lg:order-1">
							<img
								src="/hero-1.JPG"
								alt="Home Solar Installation"
								className="w-full h-[400px] object-cover shadow-lg"
							/>
						</div>

						<div className="order-1 lg:order-2">
							<span className="text-[#33B200] font-semibold text-sm uppercase tracking-wider bg-green-50 px-4 py-2 inline-block mb-4">
								Residential Impact
							</span>
							<h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-6">
								Transforming Homes Across Kenya
							</h2>
							<p className="text-gray-700 leading-relaxed mb-8 text-lg">
								Our residential solar solutions have brought reliable, affordable electricity to 
								hundreds of homes. Families enjoy uninterrupted power, lower bills, and energy 
								independence.
							</p>

							<div className="grid grid-cols-2 gap-4 mb-8">
								<div className="bg-white p-6 border border-gray-200 shadow-md">
									<div className="text-4xl font-bold text-[#33B200] mb-2">150+</div>
									<p className="text-gray-600 text-sm font-semibold">Homes Powered</p>
								</div>
								<div className="bg-white p-6 border border-gray-200 shadow-md">
									<div className="text-4xl font-bold text-[#33B200] mb-2">KES 5K</div>
									<p className="text-gray-600 text-sm font-semibold">Avg. Monthly Savings</p>
								</div>
							</div>

							<div className="space-y-3">
								{[
									"Reliable power during grid outages",
									"Lower electricity bills month after month",
									"Increased property value",
									"Clean energy for a healthier environment",
								].map((benefit, index) => (
									<div key={index} className="flex items-center gap-3">
										<div className="w-2 h-2 bg-[#33B200]"></div>
										<p className="text-gray-700">{benefit}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Community Impact */}
			<section className="py-16 md:py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<span className="text-[#33B200] font-semibold text-sm uppercase tracking-wider bg-green-50 px-4 py-2 inline-block mb-4">
							Community Impact
						</span>
						<h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-4">
							Building Stronger Communities
						</h2>
						<p className="text-gray-600 text-lg max-w-3xl mx-auto">
							Beyond providing solar solutions, we're committed to community development, 
							job creation, and empowering local talent across East Africa.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{communityBenefits.map((benefit, index) => {
							const Icon = benefit.icon;
							return (
								<div
									key={index}
									className="bg-gray-50 p-6 border border-gray-200 hover:border-[#33B200] hover:shadow-lg transition-all duration-300"
								>
									<div className="p-3 bg-[#33B200] text-white inline-block mb-4">
										<Icon className="w-6 h-6" />
									</div>
									<h3 className="text-xl font-bold text-[#244672] mb-3">
										{benefit.title}
									</h3>
									<p className="text-gray-600 text-sm leading-relaxed">
										{benefit.description}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Success Stories */}
			<section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-4">
							Real Impact Stories
						</h2>
						<p className="text-gray-600 text-lg max-w-2xl mx-auto">
							See how we've transformed businesses, homes, and communities
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{successStories.map((story, index) => (
							<div
								key={index}
								className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
							>
								<div className="relative h-48 overflow-hidden">
									<img
										src={story.image}
										alt={story.title}
										className="w-full h-full object-cover"
									/>
									<div className="absolute top-4 left-4 bg-[#33B200] text-white px-3 py-1 text-xs font-semibold uppercase">
										{story.category}
									</div>
								</div>
								<div className="p-6">
									<h3 className="text-xl font-bold text-[#244672] mb-3">
										{story.title}
									</h3>
									<p className="text-gray-700 mb-4 leading-relaxed">
										{story.impact}
									</p>
									<div className="pt-4 border-t border-gray-200">
										<p className="text-[#33B200] font-semibold text-sm">
											{story.result}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Call to Action */}
			<section className="py-16 md:py-20 bg-green-100/40">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-6">
						Be Part of the Solar Revolution
					</h2>
					<p className="text-[#244672] text-lg mb-8 max-w-2xl mx-auto">
						Join hundreds of businesses and homes already benefiting from clean, 
						reliable solar energy. Let's create a lasting impact together.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<a
							href="/contact"
							className="inline-flex items-center justify-center px-8 py-4 bg-[#244672] text-white font-semibold hover:bg-[#244672]/80 transition-colors duration-300"
						>
							Get Started Today
						</a>
						<a
							href="/projects"
							className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#244672] text-[#244672] font-semibold hover:bg-[#244672] hover:text-white transition-all duration-300"
						>
							View Our Projects
						</a>
					</div>
				</div>
			</section>

			<Footer />
		</main>
	);
}
