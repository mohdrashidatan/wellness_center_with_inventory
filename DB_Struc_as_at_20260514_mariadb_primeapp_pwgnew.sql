-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 192.168.0.202    Database: primeapp_pwgnew
-- ------------------------------------------------------
-- Server version	8.0.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE IF NOT EXISTS `primeapp_pwgnew` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `primeapp_pwgnew`;


--
-- Table structure for table `consent_health_conditions`
--

DROP TABLE IF EXISTS `consent_health_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consent_health_conditions` (
  `consent_id` int DEFAULT NULL,
  `condition_name` varchar(100) DEFAULT NULL,
  `has_condition` tinyint(1) DEFAULT NULL,
  `details` text,
  KEY `consent_id` (`consent_id`),
  CONSTRAINT `consent_health_conditions_ibfk_1` FOREIGN KEY (`consent_id`) REFERENCES `consentfrm` (`customerid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consent_health_conditions`
--

LOCK TABLES `consent_health_conditions` WRITE;
/*!40000 ALTER TABLE `consent_health_conditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `consent_health_conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consentfrm`
--

DROP TABLE IF EXISTS `consentfrm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consentfrm` (
  `consentfrmid` int NOT NULL AUTO_INCREMENT,
  `customerid` int DEFAULT NULL,
  `therapistid` int DEFAULT NULL,
  `consentfrmdate` date DEFAULT NULL,
  `voucherno` varchar(50) DEFAULT NULL,
  `device_used` varchar(40) DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `age` int DEFAULT NULL,
  `walkin` tinyint(1) DEFAULT '0',
  `nonwalkin` enum('Walk-in','Referral','Sponsor','Associate') DEFAULT NULL,
  `nonwalkinname` varchar(50) DEFAULT NULL,
  `nonwalkincontact` varchar(50) DEFAULT NULL,
  `implantbreast` tinyint(1) DEFAULT '0',
  `implantpacemaker` tinyint(1) DEFAULT '0',
  `implantelecmon` tinyint(1) DEFAULT '0',
  `implantmetal` tinyint(1) DEFAULT '0',
  `implanteyslens` tinyint(1) DEFAULT '0',
  `issueheartbypass` tinyint(1) DEFAULT '0',
  `issuecoheartdisease` tinyint(1) DEFAULT '0',
  `issuelungdisease` tinyint(1) DEFAULT '0',
  `issuediabetes` tinyint(1) DEFAULT '0',
  `issuestrokehistory` tinyint(1) DEFAULT '0',
  `issuehypertension` tinyint(1) DEFAULT '0',
  `issuepregnant` tinyint(1) DEFAULT '0',
  `issuecancer` tinyint(1) DEFAULT '0',
  `issuemenstruating` tinyint(1) DEFAULT '0',
  `issuesurgery` tinyint(1) DEFAULT '0',
  `issuehospitalninetydays` tinyint(1) DEFAULT '0',
  `issueseizure` tinyint(1) DEFAULT '0',
  `issueothers` text,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`consentfrmid`),
  KEY `customerid` (`customerid`),
  KEY `therapistid` (`therapistid`),
  CONSTRAINT `consentfrm_ibfk_1` FOREIGN KEY (`customerid`) REFERENCES `customers` (`customerid`),
  CONSTRAINT `consentfrm_ibfk_2` FOREIGN KEY (`therapistid`) REFERENCES `therapists` (`therapistsid`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consentfrm`
--

LOCK TABLES `consentfrm` WRITE;
/*!40000 ALTER TABLE `consentfrm` DISABLE KEYS */;
INSERT INTO `consentfrm` VALUES (1,1,2,'2025-08-21','2132212','','Male',NULL,1,'Walk-in','','',0,0,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,'',1,'2025-08-12 06:11:49',NULL,NULL,1),(2,2,2,'2025-08-08','2132','','Female',NULL,1,'Walk-in','','',0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,'',1,'2025-08-12 06:33:26',NULL,NULL,1),(3,3,1,'2025-08-08','2132','Product E','Male',NULL,1,'Walk-in','','',0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,'',1,'2025-08-15 11:13:35',NULL,NULL,1),(4,5,1,'2025-08-22','2132','Product B','Male',NULL,1,'Walk-in','','',0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,'',1,'2025-08-15 21:48:21',NULL,NULL,1);
/*!40000 ALTER TABLE `consentfrm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `contactid` int NOT NULL AUTO_INCREMENT,
  `contact_type` enum('Customer','Supplier','Both','Other') NOT NULL DEFAULT 'Other',
  `is_company` tinyint(1) NOT NULL DEFAULT '1',
  `code` varchar(30) DEFAULT NULL,
  `display_name` varchar(200) NOT NULL,
  `legal_name` varchar(200) DEFAULT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `website` varchar(150) DEFAULT NULL,
  `billing_address1` varchar(200) DEFAULT NULL,
  `billing_address2` varchar(200) DEFAULT NULL,
  `billing_city` varchar(100) DEFAULT NULL,
  `billing_postal_code` varchar(20) DEFAULT NULL,
  `billing_country` varchar(80) DEFAULT NULL,
  `shipping_address1` varchar(200) DEFAULT NULL,
  `shipping_address2` varchar(200) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_postal_code` varchar(20) DEFAULT NULL,
  `shipping_country` varchar(80) DEFAULT NULL,
  `payment_terms_days` int DEFAULT NULL,
  `credit_limit` decimal(19,2) DEFAULT NULL,
  `tax_reg_no` varchar(50) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT CURRENT_TIMESTAMP,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`contactid`),
  UNIQUE KEY `uq_contacts_code` (`code`),
  KEY `idx_contacts_type_active` (`contact_type`,`active`),
  KEY `idx_contacts_name` (`display_name`),
  KEY `idx_contacts_email` (`email`),
  KEY `idx_contacts_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,'Supplier',1,NULL,'Prife',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-02-15 14:20:55',NULL,NULL),(2,'Supplier',1,NULL,'Atan Bin Kadir',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-05-01 21:46:19',NULL,NULL),(3,'Supplier',1,NULL,'Daud',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-05-03 15:02:26',NULL,NULL),(4,'Supplier',1,NULL,'Jaya',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-05-03 15:12:22',NULL,NULL);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_interests`
--

DROP TABLE IF EXISTS `customer_interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_interests` (
  `customer_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  KEY `customer_id` (`customer_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `customer_interests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customerid`),
  CONSTRAINT `customer_interests_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`productid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_interests`
--

LOCK TABLES `customer_interests` WRITE;
/*!40000 ALTER TABLE `customer_interests` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customerid` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `contact_no` varchar(50) DEFAULT NULL,
  `address` text,
  `postalcode` varchar(6) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `referred_by` varchar(255) DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_no` varchar(50) DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `dateOfBirth` date DEFAULT NULL,
  `referred_other` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`customerid`),
  UNIQUE KEY `account_id` (`account_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `userac` (`useracid`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Romeo Oreo','Madagascar@gmail.com','3123','','','','','2025-08-12','Romeo Oreo','3123',NULL,1,'2025-08-12 06:11:49',NULL,NULL,1,'2011-06-13',''),(2,'Eva Eva','rraaafffii@gmail.com','083115266100','','','','','2025-08-12','Eric Jackson','32323',NULL,1,'2025-08-12 06:33:26',NULL,NULL,1,'2003-06-16',''),(3,'Romeo Oreo','Test@gmail.com','3123','','','','','2025-08-15','Romeo Oreo','3123',NULL,1,'2025-08-15 11:13:35',NULL,NULL,1,'2004-05-03',''),(4,'Ronaldo','Test@gmail.com','3123','','','','','2025-08-15','Romeo Oreo','3123',NULL,1,'2025-08-15 21:48:16',NULL,NULL,1,'2005-05-10',''),(5,'Ronaldo','Test@gmail.com','3123','','','','','2025-08-15','Romeo Oreo','3123',NULL,1,'2025-08-15 21:48:21',NULL,NULL,1,'2005-05-10','');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custpackages`
--

DROP TABLE IF EXISTS `custpackages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custpackages` (
  `custpackageid` int NOT NULL AUTO_INCREMENT,
  `customerid` int DEFAULT NULL,
  `packageid` int DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `origsessions` int DEFAULT NULL,
  `remainsessions` int DEFAULT NULL,
  PRIMARY KEY (`custpackageid`),
  KEY `customerid` (`customerid`),
  KEY `packageid` (`packageid`),
  CONSTRAINT `custpackages_ibfk_1` FOREIGN KEY (`customerid`) REFERENCES `customers` (`customerid`),
  CONSTRAINT `custpackages_ibfk_2` FOREIGN KEY (`packageid`) REFERENCES `package` (`packageid`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custpackages`
--

LOCK TABLES `custpackages` WRITE;
/*!40000 ALTER TABLE `custpackages` DISABLE KEYS */;
INSERT INTO `custpackages` VALUES (12,1,1,'2025-08-15','2025-08-15',10,10),(13,1,2,'2025-08-15','2025-08-15',15,15),(14,1,2,'2025-08-15','2025-08-15',15,15),(15,1,2,'2025-08-15','2025-08-15',15,15);
/*!40000 ALTER TABLE `custpackages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dodetails`
--

DROP TABLE IF EXISTS `dodetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dodetails` (
  `dolineid` int NOT NULL AUTO_INCREMENT,
  `doid` int DEFAULT NULL,
  `itemid` int DEFAULT NULL,
  `qty` int NOT NULL DEFAULT '0',
  `uom` varchar(10) DEFAULT NULL,
  `consign` tinyint(1) DEFAULT '0',
  `remarks` varchar(40) DEFAULT NULL,
  `batch_no` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`dolineid`),
  KEY `doid` (`doid`),
  KEY `fk_dodetails_product` (`itemid`),
  CONSTRAINT `fk_dodetails_product` FOREIGN KEY (`itemid`) REFERENCES `products` (`productid`)
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dodetails`
--

LOCK TABLES `dodetails` WRITE;
/*!40000 ALTER TABLE `dodetails` DISABLE KEYS */;
INSERT INTO `dodetails` VALUES (206,126,3,2,'BOX',0,NULL,NULL,NULL,2,'2026-05-01 22:11:53',NULL,NULL,1),(207,127,4,3,'PCS',0,NULL,NULL,NULL,2,'2026-05-03 15:03:10',NULL,NULL,0),(208,128,5,2,NULL,0,NULL,NULL,NULL,2,'2026-05-03 15:13:05',NULL,NULL,1),(209,127,4,3,'PCS',0,NULL,NULL,NULL,NULL,'2026-05-03 15:37:44',NULL,NULL,1);
/*!40000 ALTER TABLE `dodetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dohd`
--

DROP TABLE IF EXISTS `dohd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dohd` (
  `doid` int NOT NULL AUTO_INCREMENT,
  `contactid` int DEFAULT NULL,
  `transdate` datetime DEFAULT NULL,
  `transtype` varchar(45) DEFAULT NULL,
  `remarks` text,
  `reference` varchar(50) DEFAULT NULL,
  `printed` tinyint DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`doid`),
  KEY `contactid` (`contactid`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dohd`
--

LOCK TABLES `dohd` WRITE;
/*!40000 ALTER TABLE `dohd` DISABLE KEYS */;
INSERT INTO `dohd` VALUES (126,2,'2026-03-01 00:00:00',NULL,NULL,'DO39393',NULL,2,'2026-05-01 22:11:53',NULL,NULL,1),(127,3,'2026-03-31 00:00:00','Consign Sales',NULL,'D303030',NULL,2,'2026-05-03 15:03:10',NULL,NULL,1),(128,4,'2026-04-30 00:00:00','Loan Out','THIS IS A TEST','DO393939',NULL,2,'2026-05-03 15:13:05',NULL,NULL,1);
/*!40000 ALTER TABLE `dohd` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evalannotate`
--

DROP TABLE IF EXISTS `evalannotate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evalannotate` (
  `evalannotateid` int NOT NULL AUTO_INCREMENT,
  `evaluationid` int DEFAULT NULL,
  `bodyimageid` enum('1','0') DEFAULT NULL,
  `x_percent` decimal(5,2) DEFAULT NULL,
  `y_percent` decimal(5,2) DEFAULT NULL,
  `bodyimagenotes` text,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `customerid` int DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`evalannotateid`),
  KEY `evaluationid` (`evaluationid`),
  KEY `customerid` (`customerid`),
  CONSTRAINT `evalannotate_ibfk_1` FOREIGN KEY (`evaluationid`) REFERENCES `evaluations` (`evaluationid`),
  CONSTRAINT `evalannotate_ibfk_2` FOREIGN KEY (`customerid`) REFERENCES `customers` (`customerid`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evalannotate`
--

LOCK TABLES `evalannotate` WRITE;
/*!40000 ALTER TABLE `evalannotate` DISABLE KEYS */;
INSERT INTO `evalannotate` VALUES (8,4,'1',99.00,249.00,'Knee',1,'2025-08-12 06:26:55',1,'2025-08-12 06:31:13',1,NULL,NULL),(9,4,'0',68.00,121.00,'Stomach',1,'2025-08-12 06:26:55',1,'2025-08-12 06:31:13',1,NULL,NULL),(12,5,'1',98.00,221.00,'Knee2',1,'2025-08-12 06:31:59',1,'2025-08-12 06:32:15',1,NULL,NULL),(13,5,'0',92.00,254.00,'Knee 1',1,'2025-08-12 06:31:59',1,'2025-08-12 06:32:15',1,NULL,NULL),(16,6,'1',138.00,172.00,'cd',1,'2025-08-12 06:33:53',1,'2025-08-12 06:34:06',1,NULL,NULL),(17,6,'1',96.00,263.00,'Knee1',1,'2025-08-12 06:33:53',1,'2025-08-12 06:34:06',1,NULL,NULL),(18,6,'0',17.00,166.00,'Rig',1,'2025-08-12 06:33:53',1,'2025-08-12 06:34:06',1,NULL,NULL),(22,7,'0',53.00,249.00,NULL,1,'2025-08-15 21:53:38',1,'2025-08-15 21:53:51',1,NULL,NULL);
/*!40000 ALTER TABLE `evalannotate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_pain_areas`
--

DROP TABLE IF EXISTS `evaluation_pain_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_pain_areas` (
  `evaluation_id` int DEFAULT NULL,
  `pain_area` varchar(50) DEFAULT NULL,
  `idevaluation_pain_areas` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`idevaluation_pain_areas`),
  KEY `evaluation_id` (`evaluation_id`),
  CONSTRAINT `evaluation_pain_areas_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`evaluationid`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_pain_areas`
--

LOCK TABLES `evaluation_pain_areas` WRITE;
/*!40000 ALTER TABLE `evaluation_pain_areas` DISABLE KEYS */;
INSERT INTO `evaluation_pain_areas` VALUES (4,'Legs Hurt',3),(5,'I need Donutss',4),(6,'ON Right Leg',5),(7,'Legs Hurt',6);
/*!40000 ALTER TABLE `evaluation_pain_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluations` (
  `evaluationid` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `therapist_id` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `therapy_type` varchar(100) DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`evaluationid`),
  KEY `customer_id` (`customer_id`),
  KEY `therapist_id` (`therapist_id`),
  CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customerid`),
  CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`therapist_id`) REFERENCES `therapists` (`therapistsid`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
INSERT INTO `evaluations` VALUES (4,1,2,'2025-08-20','',1,'2025-08-12 06:26:55',1,'2025-08-12 06:31:13',1),(5,1,2,'2025-08-20','',1,'2025-08-12 06:31:59',1,'2025-08-12 06:32:15',1),(6,2,2,'2025-08-07','',1,'2025-08-12 06:33:53',1,'2025-08-12 06:34:06',1),(7,5,1,'2025-08-21','Product B',1,'2025-08-15 21:53:38',1,'2025-08-15 21:53:51',1);
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedbacks`
--

DROP TABLE IF EXISTS `feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedbacks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `satisfaction_rating` tinyint DEFAULT NULL,
  `recommendation_rating` tinyint DEFAULT NULL,
  `overall_experience_rating` tinyint DEFAULT NULL,
  `what_makes_satisfied` text,
  `suggestions` text,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customerid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbacks`
--

LOCK TABLES `feedbacks` WRITE;
/*!40000 ALTER TABLE `feedbacks` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grndetails`
--

DROP TABLE IF EXISTS `grndetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grndetails` (
  `grnlineid` int NOT NULL AUTO_INCREMENT,
  `grnid` int DEFAULT NULL,
  `itemid` int DEFAULT NULL,
  `qty` int NOT NULL DEFAULT '0',
  `uom` varchar(10) DEFAULT NULL,
  `consign` tinyint(1) DEFAULT '0',
  `remarks` varchar(40) DEFAULT NULL,
  `batch_no` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`grnlineid`),
  KEY `grnid` (`grnid`),
  KEY `fk_grndetails_product` (`itemid`),
  CONSTRAINT `fk_grndetails_product` FOREIGN KEY (`itemid`) REFERENCES `products` (`productid`)
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grndetails`
--

LOCK TABLES `grndetails` WRITE;
/*!40000 ALTER TABLE `grndetails` DISABLE KEYS */;
INSERT INTO `grndetails` VALUES (200,123,4,1,'BOX',0,NULL,NULL,NULL,2,'2026-04-30 21:10:20',NULL,NULL,1),(201,124,9,2,NULL,1,'Test Line 1',NULL,NULL,2,'2026-04-30 21:26:54',NULL,NULL,1),(202,124,3,1,NULL,1,'Test Line 2',NULL,NULL,2,'2026-04-30 21:26:54',NULL,NULL,1),(203,125,3,4,'BOX',0,NULL,NULL,NULL,2,'2026-04-30 21:31:59',NULL,NULL,1),(204,125,9,4,'BOX',0,NULL,NULL,NULL,2,'2026-04-30 21:31:59',NULL,NULL,1),(205,125,4,4,'PCS',0,NULL,NULL,NULL,2,'2026-04-30 21:31:59',NULL,NULL,1),(206,126,9,8,'BOX',0,NULL,NULL,NULL,2,'2026-05-01 21:29:47',NULL,NULL,1),(207,127,4,2,'PCS',0,NULL,NULL,NULL,2,'2026-05-01 21:31:44',NULL,NULL,1);
/*!40000 ALTER TABLE `grndetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grnhd`
--

DROP TABLE IF EXISTS `grnhd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grnhd` (
  `grnid` int NOT NULL AUTO_INCREMENT,
  `contactid` int DEFAULT NULL,
  `receiptdate` datetime DEFAULT NULL,
  `remarks` text,
  `delivery_order_no` varchar(50) DEFAULT NULL,
  `printed` tinyint DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`grnid`),
  KEY `contactid` (`contactid`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grnhd`
--

LOCK TABLES `grnhd` WRITE;
/*!40000 ALTER TABLE `grnhd` DISABLE KEYS */;
INSERT INTO `grnhd` VALUES (123,1,'2026-04-30 00:00:00',NULL,'DO300303',NULL,2,'2026-04-30 21:10:20',NULL,NULL,1),(124,1,'2026-03-01 00:00:00','Receipt Header','DO39939393939',NULL,2,'2026-04-30 21:26:54',NULL,NULL,1),(125,1,'2026-04-29 00:00:00',NULL,'DO30303333',NULL,2,'2026-04-30 21:31:59',NULL,NULL,1),(126,1,'2026-05-01 00:00:00',NULL,'DO39393',NULL,2,'2026-05-01 21:29:47',NULL,NULL,1),(127,NULL,'2026-05-01 00:00:00',NULL,'DO393939393',NULL,2,'2026-05-01 21:31:44',NULL,NULL,1);
/*!40000 ALTER TABLE `grnhd` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package`
--

DROP TABLE IF EXISTS `package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package` (
  `packageid` int NOT NULL AUTO_INCREMENT,
  `packagedesc` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `expiry_days` int DEFAULT NULL,
  `noofsession` int DEFAULT NULL,
  PRIMARY KEY (`packageid`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package`
--

LOCK TABLES `package` WRITE;
/*!40000 ALTER TABLE `package` DISABLE KEYS */;
INSERT INTO `package` VALUES (1,'Trilogy',300.00,365,10),(2,'Trilogy - Itera 30min Bioite 30min Massage 30min for 10 visit',300.00,365,15);
/*!40000 ALTER TABLE `package` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packagedetails`
--

DROP TABLE IF EXISTS `packagedetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `packagedetails` (
  `packagedetailsid` int NOT NULL AUTO_INCREMENT,
  `packageid` int DEFAULT NULL,
  `productid` int DEFAULT NULL,
  `consumeprice` decimal(10,2) DEFAULT '0.00',
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`packagedetailsid`),
  KEY `productid` (`productid`),
  CONSTRAINT `packagedetails_ibfk_1` FOREIGN KEY (`productid`) REFERENCES `products` (`productid`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packagedetails`
--

LOCK TABLES `packagedetails` WRITE;
/*!40000 ALTER TABLE `packagedetails` DISABLE KEYS */;
INSERT INTO `packagedetails` VALUES (1,1,6,20.00,NULL,NULL,NULL,NULL,1),(2,1,7,19.00,NULL,NULL,NULL,NULL,1),(3,2,6,20.00,NULL,NULL,NULL,NULL,1),(4,2,7,19.00,NULL,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `packagedetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poshd`
--

DROP TABLE IF EXISTS `poshd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poshd` (
  `posid` int NOT NULL AUTO_INCREMENT,
  `customerid` int DEFAULT NULL,
  `therapist_id` int DEFAULT NULL,
  `walkin` tinyint(1) DEFAULT '1',
  `walkinname` varchar(50) DEFAULT NULL,
  `walkincontactno` varchar(10) DEFAULT NULL,
  `walkinemail` varchar(50) DEFAULT NULL,
  `transdate` datetime DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `remarks` text,
  `printed` tinyint DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `payment_method` enum('Cash','Card','Paynow') NOT NULL,
  `printdisc` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`posid`),
  KEY `customerid` (`customerid`),
  KEY `therapist_id` (`therapist_id`),
  CONSTRAINT `poshd_ibfk_1` FOREIGN KEY (`customerid`) REFERENCES `customers` (`customerid`),
  CONSTRAINT `poshd_ibfk_2` FOREIGN KEY (`therapist_id`) REFERENCES `therapists` (`therapistsid`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poshd`
--

LOCK TABLES `poshd` WRITE;
/*!40000 ALTER TABLE `poshd` DISABLE KEYS */;
INSERT INTO `poshd` VALUES (121,1,1,1,'','','','2025-08-15 21:30:50',150.00,NULL,NULL,1,'2025-08-15 21:30:50',NULL,NULL,1,'Cash',1),(122,1,1,1,'','','','2025-08-15 21:36:55',450.00,NULL,NULL,1,'2025-08-15 21:36:55',NULL,NULL,1,'Cash',0),(123,NULL,NULL,1,'Lee Yoe Kong','64454703','','2026-02-15 22:32:21',65.00,NULL,NULL,2,'2026-02-15 22:32:21',NULL,NULL,1,'Cash',0),(124,NULL,NULL,1,'Lee','96834401','yklee@gmail.com','2026-02-16 21:12:28',115.00,NULL,NULL,2,'2026-02-16 21:12:28',NULL,NULL,1,'Paynow',0),(125,NULL,NULL,1,'Lee','96834401','yklee@gmail.com','2026-02-16 21:17:36',115.00,NULL,NULL,2,'2026-02-16 21:17:36',NULL,NULL,1,'Paynow',0),(126,NULL,NULL,1,'Harrif Hambali','96855401','mohdrashid.atan@gmail.com','2026-02-16 21:28:59',110.00,NULL,NULL,2,'2026-02-16 21:28:59',NULL,NULL,1,'Cash',0),(127,NULL,NULL,1,'Harrif Hambali','96855401','mohdrashid.atan@gmail.com','2026-02-16 21:29:58',110.00,NULL,NULL,2,'2026-02-16 21:29:58',NULL,NULL,1,'Cash',0),(128,NULL,NULL,1,'','','','2026-02-17 09:06:24',120.00,NULL,NULL,2,'2026-02-17 09:06:24',NULL,NULL,1,'Card',0),(129,NULL,NULL,1,'','','','2026-02-17 09:12:02',150.00,NULL,NULL,2,'2026-02-17 09:12:02',NULL,NULL,1,'Cash',0);
/*!40000 ALTER TABLE `poshd` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poslines`
--

DROP TABLE IF EXISTS `poslines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poslines` (
  `poslinesid` int NOT NULL AUTO_INCREMENT,
  `posid` int DEFAULT NULL,
  `productcat` varchar(15) DEFAULT NULL,
  `itemid` int DEFAULT NULL,
  `qty` int NOT NULL DEFAULT '0',
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `disc` decimal(10,2) DEFAULT NULL,
  `discpercent` char(1) DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `oriprice` decimal(10,2) NOT NULL DEFAULT '0.00',
  `remarks` varchar(40) DEFAULT NULL,
  `package` tinyint(1) DEFAULT '0',
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`poslinesid`),
  KEY `posid` (`posid`),
  KEY `fk_itemid_products` (`itemid`),
  CONSTRAINT `fk_itemid_products` FOREIGN KEY (`itemid`) REFERENCES `products` (`productid`),
  CONSTRAINT `poslines_ibfk_1` FOREIGN KEY (`posid`) REFERENCES `poshd` (`posid`)
) ENGINE=InnoDB AUTO_INCREMENT=217 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poslines`
--

LOCK TABLES `poslines` WRITE;
/*!40000 ALTER TABLE `poslines` DISABLE KEYS */;
INSERT INTO `poslines` VALUES (198,121,'Package',2,1,300.00,50.00,'1',150.00,0.00,NULL,1,1,'2025-08-15 21:30:51',NULL,NULL,1),(199,122,'Package',2,3,300.00,50.00,'1',450.00,0.00,NULL,1,1,'2025-08-15 21:36:55',NULL,NULL,1),(200,123,'Product',3,1,23.00,0.00,'0',23.00,23.00,NULL,0,2,'2026-02-15 22:32:21',NULL,NULL,1),(201,123,'Product',1,2,21.00,0.00,'0',42.00,42.00,NULL,0,2,'2026-02-15 22:32:21',NULL,NULL,1),(202,124,'Product',3,1,23.00,0.00,'0',23.00,23.00,NULL,0,2,'2026-02-16 21:12:29',NULL,NULL,1),(203,124,'Product',2,1,22.00,0.00,'0',22.00,22.00,NULL,0,2,'2026-02-16 21:12:29',NULL,NULL,1),(204,124,'Product',1,1,21.00,0.00,'0',21.00,21.00,NULL,0,2,'2026-02-16 21:12:29',NULL,NULL,1),(205,124,'Product',4,1,24.00,0.00,'0',24.00,24.00,NULL,0,2,'2026-02-16 21:12:29',NULL,NULL,1),(206,124,'Product',5,1,25.00,0.00,'0',25.00,25.00,NULL,0,2,'2026-02-16 21:12:29',NULL,NULL,1),(207,125,'Product',2,1,22.00,0.00,'0',22.00,22.00,NULL,0,2,'2026-02-16 21:17:36',NULL,NULL,1),(208,125,'Product',3,1,23.00,0.00,'0',23.00,23.00,NULL,0,2,'2026-02-16 21:17:36',NULL,NULL,1),(209,125,'Product',4,1,24.00,0.00,'0',24.00,24.00,NULL,0,2,'2026-02-16 21:17:36',NULL,NULL,1),(210,125,'Product',1,1,21.00,0.00,'0',21.00,21.00,NULL,0,2,'2026-02-16 21:17:36',NULL,NULL,1),(211,125,'Product',5,1,25.00,0.00,'0',25.00,25.00,NULL,0,2,'2026-02-16 21:17:36',NULL,NULL,1),(212,126,'Service',8,1,80.00,0.00,'0',80.00,80.00,NULL,0,2,'2026-02-16 21:28:59',NULL,NULL,1),(213,126,'Service',7,1,30.00,0.00,'0',30.00,30.00,NULL,0,2,'2026-02-16 21:28:59',NULL,NULL,1),(214,127,'Service',7,1,30.00,0.00,'0',30.00,30.00,NULL,0,2,'2026-02-16 21:29:59',NULL,NULL,1),(215,127,'Service',8,1,80.00,0.00,'0',80.00,80.00,NULL,0,2,'2026-02-16 21:29:59',NULL,NULL,1),(216,129,'Service',6,1,30.00,0.00,'0',30.00,30.00,NULL,0,2,'2026-02-17 09:12:02',NULL,NULL,1);
/*!40000 ALTER TABLE `poslines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `possetup`
--

DROP TABLE IF EXISTS `possetup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `possetup` (
  `setupid` int NOT NULL AUTO_INCREMENT,
  `coyname` varchar(100) DEFAULT NULL,
  `addr1` varchar(100) DEFAULT NULL,
  `addr2` varchar(100) DEFAULT NULL,
  `addr3` varchar(100) DEFAULT NULL,
  `signaturename1` varchar(90) DEFAULT NULL,
  `titlename1` varchar(45) DEFAULT NULL,
  `coyemail` varchar(255) DEFAULT NULL,
  `coycontactnumber` varchar(255) DEFAULT NULL,
  `nextinvnum` int DEFAULT NULL,
  `active` bit(1) DEFAULT b'1',
  `createdby` int DEFAULT NULL,
  `createddate` timestamp NULL DEFAULT NULL,
  `modifiedby` int DEFAULT NULL,
  `modifieddate` datetime DEFAULT NULL,
  PRIMARY KEY (`setupid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Setup informaiton';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `possetup`
--

LOCK TABLES `possetup` WRITE;
/*!40000 ALTER TABLE `possetup` DISABLE KEYS */;
INSERT INTO `possetup` VALUES (3,'Terran Care Pte Ltd','55 Changi Road','Millage #02-05',NULL,NULL,NULL,NULL,NULL,NULL,_binary '',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `possetup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_master`
--

DROP TABLE IF EXISTS `product_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_master` (
  `productid` int NOT NULL,
  `base_uom_id` int NOT NULL,
  `is_stock_item` tinyint(1) NOT NULL DEFAULT '1',
  `is_variant_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `is_serialized` tinyint(1) NOT NULL DEFAULT '0',
  `is_batch_tracked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`productid`),
  KEY `idx_pm_base_uom` (`base_uom_id`),
  CONSTRAINT `fk_pm_base_uom` FOREIGN KEY (`base_uom_id`) REFERENCES `uom` (`uom_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pm_product` FOREIGN KEY (`productid`) REFERENCES `products` (`productid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_master`
--

LOCK TABLES `product_master` WRITE;
/*!40000 ALTER TABLE `product_master` DISABLE KEYS */;
INSERT INTO `product_master` VALUES (1,1,1,0,0,0),(2,1,1,0,0,0),(3,1,0,1,0,0),(4,2,0,0,0,0),(9,1,1,1,0,0);
/*!40000 ALTER TABLE `product_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_sku`
--

DROP TABLE IF EXISTS `product_sku`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_sku` (
  `sku_id` int NOT NULL AUTO_INCREMENT,
  `productid` int NOT NULL,
  `sku_code` varchar(64) NOT NULL,
  `sku_name` varchar(150) DEFAULT NULL,
  `unitprice` decimal(19,4) DEFAULT NULL,
  `baseprice` decimal(19,4) DEFAULT NULL,
  `packageprice` decimal(19,4) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sku_id`),
  UNIQUE KEY `uq_sku_code` (`sku_code`),
  KEY `idx_sku_product` (`productid`),
  CONSTRAINT `fk_sku_product` FOREIGN KEY (`productid`) REFERENCES `products` (`productid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_sku`
--

LOCK TABLES `product_sku` WRITE;
/*!40000 ALTER TABLE `product_sku` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_sku` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_sku_value`
--

DROP TABLE IF EXISTS `product_sku_value`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_sku_value` (
  `sku_id` int NOT NULL,
  `value_id` int NOT NULL,
  PRIMARY KEY (`sku_id`,`value_id`),
  KEY `idx_psv_value` (`value_id`),
  CONSTRAINT `fk_psv_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_sku` (`sku_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_psv_value` FOREIGN KEY (`value_id`) REFERENCES `variant_option_value` (`value_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_sku_value`
--

LOCK TABLES `product_sku_value` WRITE;
/*!40000 ALTER TABLE `product_sku_value` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_sku_value` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_uom`
--

DROP TABLE IF EXISTS `product_uom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_uom` (
  `product_uom_id` int NOT NULL AUTO_INCREMENT,
  `productid` int NOT NULL,
  `uom_id` int NOT NULL,
  `factor_to_base` decimal(18,6) NOT NULL DEFAULT '1.000000',
  `uom_price` decimal(19,4) DEFAULT NULL,
  `is_default_sell_uom` tinyint(1) NOT NULL DEFAULT '0',
  `is_default_purchase_uom` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`product_uom_id`),
  UNIQUE KEY `uq_product_uom` (`productid`,`uom_id`),
  KEY `idx_product_uom_product` (`productid`),
  KEY `idx_product_uom_uom` (`uom_id`),
  CONSTRAINT `fk_pu_product` FOREIGN KEY (`productid`) REFERENCES `products` (`productid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pu_uom` FOREIGN KEY (`uom_id`) REFERENCES `uom` (`uom_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_factor_to_base` CHECK ((`factor_to_base` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_uom`
--

LOCK TABLES `product_uom` WRITE;
/*!40000 ALTER TABLE `product_uom` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_uom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `productid` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `productcat` enum('Service','Product') DEFAULT NULL,
  `unitprice` decimal(10,2) DEFAULT NULL,
  `baseprice` decimal(10,2) DEFAULT NULL,
  `packageprice` decimal(19,2) DEFAULT NULL,
  `description` text,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`productid`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Prife Vision Eye Essence','Product',21.00,10.00,21.12,'Prife Vision Eye Essence\n',NULL,NULL,NULL,'2026-02-19 15:08:19',1),(2,'Prife Luxe Bean anti aging serum spray','Product',22.00,10.00,21.12,'Good Item',NULL,NULL,NULL,'2026-02-19 15:09:05',1),(3,'Watches','Product',1000.00,10.00,21.12,'Watches',NULL,NULL,NULL,'2026-02-19 15:09:49',1),(4,'Product D','Product',24.00,10.00,21.12,'Good Item',NULL,NULL,NULL,'2026-04-30 21:15:07',1),(5,'Product E','Product',25.00,10.00,21.12,'Good Item',NULL,NULL,NULL,NULL,1),(6,'Biolite30','Service',30.00,20.00,20.00,'BioliteItera 30 min',NULL,NULL,NULL,NULL,1),(7,'Itera40','Service',30.00,20.00,19.00,'Itera 30 min',NULL,NULL,NULL,NULL,1),(8,'Magnoseek','Service',80.00,40.00,35.00,'Magnoseek Session',NULL,NULL,NULL,NULL,1),(9,'Prife Envy Speccs Anion Anti Blue Light Glasses','Product',120.00,110.00,0.00,'Superior to Sunglasses. add blue light protection while enhancing style.',NULL,'2026-02-17 08:51:53',NULL,NULL,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session_notes`
--

DROP TABLE IF EXISTS `session_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_notes` (
  `session_notesid` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `therapists_id` int DEFAULT NULL,
  `evaluation_id` int DEFAULT NULL,
  `transactions_id` int DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `on_medication` tinyint(1) DEFAULT NULL,
  `medication_details` text,
  `therapist_note` text,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`session_notesid`),
  KEY `customer_id` (`customer_id`),
  KEY `evaluation_id` (`evaluation_id`),
  KEY `transactions_id` (`transactions_id`),
  KEY `therapists_id` (`therapists_id`),
  CONSTRAINT `session_notes_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customerid`),
  CONSTRAINT `session_notes_ibfk_2` FOREIGN KEY (`therapists_id`) REFERENCES `therapists` (`therapistsid`),
  CONSTRAINT `session_notes_ibfk_3` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`evaluationid`),
  CONSTRAINT `session_notes_ibfk_4` FOREIGN KEY (`transactions_id`) REFERENCES `poshd` (`posid`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session_notes`
--

LOCK TABLES `session_notes` WRITE;
/*!40000 ALTER TABLE `session_notes` DISABLE KEYS */;
INSERT INTO `session_notes` VALUES (4,1,2,4,NULL,23,1,'Vitamin','Ok healthy and health',1,'2025-08-12 06:26:55',1,'2025-08-12 06:31:13',1),(5,1,2,5,NULL,12,1,'Choclat Donut','He healthy and he super healthy2',1,'2025-08-12 06:31:59',1,'2025-08-12 06:32:15',1),(6,2,2,6,NULL,21,1,'Vitamin','Test 1 2 3',1,'2025-08-12 06:33:53',1,'2025-08-12 06:34:06',1),(7,5,1,7,NULL,21,1,'Vitamin','Hurt light ',1,'2025-08-15 21:53:38',1,'2025-08-15 21:53:51',1);
/*!40000 ALTER TABLE `session_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `therapists`
--

DROP TABLE IF EXISTS `therapists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `therapists` (
  `therapistsid` int NOT NULL AUTO_INCREMENT,
  `therapistname` varchar(50) DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`therapistsid`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `therapists_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `userac` (`useracid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `therapists`
--

LOCK TABLES `therapists` WRITE;
/*!40000 ALTER TABLE `therapists` DISABLE KEYS */;
INSERT INTO `therapists` VALUES (1,'Tomiyasu',1,NULL,NULL,NULL,NULL,1),(2,'Virgil',NULL,NULL,NULL,NULL,NULL,1),(3,'Mark',NULL,NULL,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `therapists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uom`
--

DROP TABLE IF EXISTS `uom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uom` (
  `uom_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `name` varchar(50) NOT NULL,
  `uom_type` enum('quantity','weight','volume','length','other') DEFAULT 'quantity',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`uom_id`),
  UNIQUE KEY `uq_uom_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uom`
--

LOCK TABLES `uom` WRITE;
/*!40000 ALTER TABLE `uom` DISABLE KEYS */;
INSERT INTO `uom` VALUES (1,'BOX','Box','quantity',1),(2,'PCS','Piece','quantity',1);
/*!40000 ALTER TABLE `uom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userac`
--

DROP TABLE IF EXISTS `userac`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userac` (
  `useracid` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `role` enum('Customer','Therapist','Admin') DEFAULT NULL,
  `active` bit(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`useracid`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userac`
--

LOCK TABLES `userac` WRITE;
/*!40000 ALTER TABLE `userac` DISABLE KEYS */;
INSERT INTO `userac` VALUES (1,NULL,'therapist1@gmail.com','$2b$10$Q3RVfKwLZ/xTDVno11FIo.7U.Kgw.DtCScie7Hj7rRd1uSCdirF9O','Therapist',_binary ''),(2,'rashid','mra@primesolutions.com.sg','$2b$10$5P4CpvoQHXWSyLs7kc2nkOJ.xc2oS.yLYQbWRIlqVWH76QlDLxngG','Admin',_binary '');
/*!40000 ALTER TABLE `userac` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variant_option`
--

DROP TABLE IF EXISTS `variant_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variant_option` (
  `option_id` int NOT NULL AUTO_INCREMENT,
  `productid` int NOT NULL,
  `option_name` varchar(50) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `uq_variant_option` (`productid`,`option_name`),
  KEY `idx_vo_product` (`productid`),
  CONSTRAINT `fk_vo_product` FOREIGN KEY (`productid`) REFERENCES `products` (`productid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variant_option`
--

LOCK TABLES `variant_option` WRITE;
/*!40000 ALTER TABLE `variant_option` DISABLE KEYS */;
INSERT INTO `variant_option` VALUES (1,9,'Color',0,1),(2,3,'Brown Strap',0,1),(3,3,'Brown Strap Small Face',0,0),(4,3,'Black Strap',0,1),(5,3,'Black Strap Large Face',0,0);
/*!40000 ALTER TABLE `variant_option` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variant_option_value`
--

DROP TABLE IF EXISTS `variant_option_value`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variant_option_value` (
  `value_id` int NOT NULL AUTO_INCREMENT,
  `option_id` int NOT NULL,
  `value_name` varchar(50) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`value_id`),
  UNIQUE KEY `uq_option_value` (`option_id`,`value_name`),
  KEY `idx_vov_option` (`option_id`),
  CONSTRAINT `fk_vov_option` FOREIGN KEY (`option_id`) REFERENCES `variant_option` (`option_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variant_option_value`
--

LOCK TABLES `variant_option_value` WRITE;
/*!40000 ALTER TABLE `variant_option_value` DISABLE KEYS */;
INSERT INTO `variant_option_value` VALUES (1,1,'Green',0,1),(2,1,'Blue',0,1),(3,1,'Grey',0,1),(4,1,'Purple',0,1),(5,4,'Large Face',0,1),(6,4,'Small Face',0,1),(7,2,'Large Face',0,1),(8,2,'Small Face',0,1);
/*!40000 ALTER TABLE `variant_option_value` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-14 23:24:53

