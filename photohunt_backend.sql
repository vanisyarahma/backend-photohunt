-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 16, 2026 at 11:50 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `photohunt_backend`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `mitra_id` int(11) DEFAULT NULL,
  `booking_date` date DEFAULT NULL,
  `booking_time` varchar(20) DEFAULT NULL,
  `status` enum('pending','confirmed','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `studios`
--

CREATE TABLE `studios` (
  `id` int(11) NOT NULL,
  `mitra_id` int(11) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `category` enum('photobox','photostudio') DEFAULT NULL,
  `city` varchar(50) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `price_range` varchar(100) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `studios`
--

INSERT INTO `studios` (`id`, `mitra_id`, `name`, `location`, `category`, `city`, `latitude`, `longitude`, `price`, `price_range`, `capacity`, `description`, `status`, `created_at`, `image`) VALUES
(4, 1, 'Selfie Time', 'Mall Lippo Cikarang', 'photobox', 'bekasi', NULL, NULL, 75000, NULL, 4, 'Studio foto self service dengan berbagai tema', 'active', '2026-01-15 04:48:41', 'selfietime.jpg'),
(6, 1, 'Selfie Time Bekasi', 'Summarecon Mall', 'photobox', 'bekasi', NULL, NULL, 50000, NULL, 4, 'Photobox lucu', 'active', '2026-01-15 05:59:00', NULL),
(7, 1, 'Selfie Time Jakarta', 'Mall Taman Anggrek', 'photobox', 'jakarta', NULL, NULL, 55000, NULL, 4, 'Photobox jakarta', 'active', '2026-01-15 05:59:00', NULL),
(8, 2, 'Studio Pro Depok', 'Margonda', 'photostudio', 'depok', NULL, NULL, 250000, NULL, 10, 'Studio profesional', 'active', '2026-01-15 05:59:00', NULL),
(9, 2, 'Studio Wedding Tangerang', 'BSD', 'photostudio', 'tangerang', NULL, NULL, 300000, NULL, 15, 'Studio wedding', 'active', '2026-01-15 05:59:00', NULL),
(12, 3, 'awdadad', NULL, 'photobox', 'bekasi', -6.3369367, 107.1574668, NULL, '50.000 - 120.000', NULL, 'wadawda', 'active', '2026-01-16 10:04:52', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `studio_facilities`
--

CREATE TABLE `studio_facilities` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `facility` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `studio_images`
--

CREATE TABLE `studio_images` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `studio_packages`
--

CREATE TABLE `studio_packages` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` int(11) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `studio_schedules`
--

CREATE TABLE `studio_schedules` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `day` enum('senin','selasa','rabu','kamis','jumat','sabtu','minggu') NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('mitra','customer') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Mitra Demo', 'mitra@demo.com', '123', 'mitra', '2026-01-15 04:48:41'),
(2, 'Customer Demo', 'user@demo.com', '123', 'customer', '2026-01-15 04:48:41'),
(3, 'Rizka Ana Nur Hanizah', 'rizka.nur@mail.com', '11', 'mitra', '2026-01-16 05:18:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `studio_id` (`studio_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `mitra_id` (`mitra_id`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `studios`
--
ALTER TABLE `studios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mitra_id` (`mitra_id`);

--
-- Indexes for table `studio_facilities`
--
ALTER TABLE `studio_facilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_studio_facilities` (`studio_id`);

--
-- Indexes for table `studio_images`
--
ALTER TABLE `studio_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_studio_images` (`studio_id`);

--
-- Indexes for table `studio_packages`
--
ALTER TABLE `studio_packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_studio_packages` (`studio_id`);

--
-- Indexes for table `studio_schedules`
--
ALTER TABLE `studio_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_studio_schedules` (`studio_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `studios`
--
ALTER TABLE `studios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `studio_facilities`
--
ALTER TABLE `studio_facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `studio_images`
--
ALTER TABLE `studio_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `studio_packages`
--
ALTER TABLE `studio_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `studio_schedules`
--
ALTER TABLE `studio_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`mitra_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `chats_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `studios`
--
ALTER TABLE `studios`
  ADD CONSTRAINT `studios_ibfk_1` FOREIGN KEY (`mitra_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `studio_facilities`
--
ALTER TABLE `studio_facilities`
  ADD CONSTRAINT `fk_studio_facilities` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `studio_images`
--
ALTER TABLE `studio_images`
  ADD CONSTRAINT `fk_studio_images` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `studio_packages`
--
ALTER TABLE `studio_packages`
  ADD CONSTRAINT `fk_studio_packages` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `studio_schedules`
--
ALTER TABLE `studio_schedules`
  ADD CONSTRAINT `fk_studio_schedules` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
