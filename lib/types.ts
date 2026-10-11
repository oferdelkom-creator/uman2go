export * from './generated-types';
import type { Tables } from './generated-types';

// Convenience aliases used throughout the app.
export type Hotel = Tables<"hotels">
export type Room = Tables<"rooms">
export type Booking = Tables<"bookings">
export type HotelReview = Tables<"hotel_reviews">
export type Driver = Tables<"drivers">
export type DriverRoute = Tables<"driver_routes">
export type DriverReview = Tables<"driver_reviews">
export type TransportRequest = Tables<"transport_requests">
export type TourGuide = Tables<"tour_guides">
export type TourDate = Tables<"tour_dates">
export type TourSignup = Tables<"tour_signups">
export type Profile = Tables<"profiles">
export type VipRequest = Tables<"vip_requests">
export type InvestmentRequest = Tables<"investment_requests">
export type FlightRequest = Tables<"flight_requests">
export type HomeRentalLead = Tables<"home_rental_leads">
export type ProviderApplication = Tables<"provider_applications">
export type TripRequest = Tables<"trip_requests">
