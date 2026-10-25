export interface JavaFile {
  path: string;
  name: string;
  package?: string;
  language: string;
  description: string;
  content: string;
}

export const JAVA_PROJECT_FILES: JavaFile[] = [
  {
    path: 'pom.xml',
    name: 'pom.xml',
    language: 'xml',
    description: 'Maven Project Object Model with H2 Database dependency, Java 11+ compiler plugin, and Exec plugin for running the GUI',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.pharmacy</groupId>
    <artifactId>smart-pharmacy-system</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>Smart Pharmacy Management System</name>
    <description>Desktop Java Swing &amp; Embedded H2 Database Management System</description>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <h2.version>2.2.224</h2.version>
    </properties>

    <dependencies>
        <!-- H2 Database Engine (Embedded local database) -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <version>\${h2.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Maven Compiler Plugin configured for Java 11+ -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                    <encoding>UTF-8</encoding>
                </configuration>
            </plugin>

            <!-- Exec Maven Plugin to run the application directly via 'mvn exec:java' -->
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <mainClass>com.pharmacy.Main</mainClass>
                </configuration>
            </plugin>

            <!-- Maven Shade / Jar Plugin for building an executable Standalone Fat JAR -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.3.0</version>
                <configuration>
                    <archive>
                        <manifest>
                            <addClasspath>true</addClasspath>
                            <mainClass>com.pharmacy.Main</mainClass>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`
  },
  {
    path: 'src/main/java/com/pharmacy/Main.java',
    name: 'Main.java',
    package: 'com.pharmacy',
    language: 'java',
    description: 'Application entry point: sets modern Swing Look and Feel, verifies database bootstrap, and launches PharmacyGUI on the Event Dispatch Thread',
    content: `package com.pharmacy;

import com.pharmacy.db.DatabaseManager;
import com.pharmacy.ui.PharmacyGUI;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.UnsupportedLookAndFeelException;

/**
 * Main application entry point for the Smart Pharmacy Management System.
 * Overrides default Look-and-Feel with Nimbus or System native UI,
 * ensures embedded database tables are ready, and starts the Swing GUI.
 */
public class Main {

    public static void main(String[] args) {
        // Step 1: Configure Look and Feel before any Swing component is initialized
        setupLookAndFeel();

        // Step 2: Initialize embedded H2 database tables and default sample records
        DatabaseManager.initializeDatabase();

        // Step 3: Launch Graphical User Interface safely on the Swing Event Dispatch Thread (EDT)
        SwingUtilities.invokeLater(() -> {
            try {
                PharmacyGUI gui = new PharmacyGUI();
                gui.setVisible(true);
            } catch (Exception e) {
                System.err.println("Fatal error starting Pharmacy GUI: " + e.getMessage());
                e.printStackTrace();
            }
        });

        // Register shutdown hook to cleanly close database connections upon exit
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Application shutting down: closing database connections...");
            DatabaseManager.closeConnection();
        }));
    }

    /**
     * Applies Nimbus Look and Feel if available, otherwise falls back to System Look and Feel.
     */
    private static void setupLookAndFeel() {
        try {
            for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equalsIgnoreCase(info.getName())) {
                    UIManager.setLookAndFeel(info.getClassName());
                    return;
                }
            }
            // Fallback to platform native look and feel
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (ClassNotFoundException | InstantiationException | 
                 IllegalAccessException | UnsupportedLookAndFeelException e) {
            System.out.println("Nimbus Look and Feel not available, using default. Details: " + e.getMessage());
        }
    }
}`
  },
  {
    path: 'src/main/java/com/pharmacy/db/DatabaseManager.java',
    name: 'DatabaseManager.java',
    package: 'com.pharmacy.db',
    language: 'java',
    description: 'Direct JDBC connection provider for embedded H2, automatic table creation (medicines & sales), seed data loader, and resource management',
    content: `package com.pharmacy.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Manages JDBC connections, table schemas, and initial seeding for the
 * embedded H2 database. Database files persist in the local './data/pharmacy_db' folder.
 */
public class DatabaseManager {

    // Embedded H2 file database connection string (auto-server mode allows tools to connect)
    private static final String DB_URL = "jdbc:h2:./data/pharmacy_db;DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE";
    private static final String DB_USER = "sa";
    private static final String DB_PASSWORD = "";

    private static Connection connection = null;

    /**
     * Retrieves or establishes the active JDBC Connection to the embedded H2 instance.
     */
    public static synchronized Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            try {
                Class.forName("org.h2.Driver");
            } catch (ClassNotFoundException e) {
                System.err.println("H2 Driver not found on classpath: " + e.getMessage());
            }
            connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
        }
        return connection;
    }

    /**
     * Bootstraps necessary tables and seeds initial realistic medicines if the database is newly created.
     */
    public static void initializeDatabase() {
        String createMedicinesTable = 
            "CREATE TABLE IF NOT EXISTS medicines (" +
            "  id INT AUTO_INCREMENT PRIMARY KEY, " +
            "  name VARCHAR(120) NOT NULL UNIQUE, " +
            "  batch_id VARCHAR(50) NOT NULL, " +
            "  stock_quantity INT NOT NULL CHECK (stock_quantity >= 0), " +
            "  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0), " +
            "  expiry_date DATE NOT NULL" +
            ");";

        String createSalesTable = 
            "CREATE TABLE IF NOT EXISTS sales (" +
            "  id INT AUTO_INCREMENT PRIMARY KEY, " +
            "  medicine_name VARCHAR(120) NOT NULL, " +
            "  quantity_selected INT NOT NULL, " +
            "  unit_cost DECIMAL(10, 2) NOT NULL, " +
            "  total_bill DECIMAL(10, 2) NOT NULL, " +
            "  transaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
            ");";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute(createMedicinesTable);
            stmt.execute(createSalesTable);
            System.out.println("H2 Database schemas verified successfully.");

            // Populate sample pharmacy inventory if empty
            seedInitialMedicinesIfEmpty(conn);

        } catch (SQLException e) {
            System.err.println("Database initialization error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Inserts standard initial medicine inventory records to give the presentation immediate realistic data.
     */
    private static void seedInitialMedicinesIfEmpty(Connection conn) {
        String countSql = "SELECT COUNT(*) FROM medicines";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(countSql)) {

            if (rs.next() && rs.getInt(1) == 0) {
                System.out.println("Empty inventory detected. Seeding sample pharmaceutical stock...");
                
                String insertSql = "INSERT INTO medicines (name, batch_id, stock_quantity, price, expiry_date) VALUES (?, ?, ?, ?, ?)";
                try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
                    
                    // 1. Normal stock item
                    pstmt.setString(1, "Amoxicillin 500mg");
                    pstmt.setString(2, "BAT-AMX-2024");
                    pstmt.setInt(3, 85);
                    pstmt.setDouble(4, 14.50);
                    pstmt.setString(5, "2027-08-15");
                    pstmt.executeUpdate();

                    // 2. Low-stock item (quantity <= 10)
                    pstmt.setString(1, "Paracetamol 650mg");
                    pstmt.setString(2, "BAT-PCM-1102");
                    pstmt.setInt(3, 6); // Triggers LOW STOCK alert
                    pstmt.setDouble(4, 4.25);
                    pstmt.setString(5, "2027-11-20");
                    pstmt.executeUpdate();

                    // 3. Near-expiry item (< 30 days)
                    pstmt.setString(1, "Azithromycin 250mg");
                    pstmt.setString(2, "BAT-AZM-9031");
                    pstmt.setInt(3, 40);
                    pstmt.setDouble(4, 22.00);
                    pstmt.setString(5, "2026-11-10"); // Triggers NEAR EXPIRY alert
                    pstmt.executeUpdate();

                    // 4. Critical: Both Low Stock and Near Expiry
                    pstmt.setString(1, "Cough Expectorant Syrup");
                    pstmt.setString(2, "BAT-SYR-4421");
                    pstmt.setInt(3, 4); // LOW STOCK
                    pstmt.setDouble(4, 8.75);
                    pstmt.setString(5, "2026-11-05"); // NEAR EXPIRY
                    pstmt.executeUpdate();

                    // 5. Standard high-demand medicine
                    pstmt.setString(1, "Cetirizine 10mg");
                    pstmt.setString(2, "BAT-CTZ-7714");
                    pstmt.setInt(3, 120);
                    pstmt.setDouble(4, 6.00);
                    pstmt.setString(5, "2028-03-30");
                    pstmt.executeUpdate();

                    // 6. Insulin Glargine Pen
                    pstmt.setString(1, "Insulin Glargine 100IU");
                    pstmt.setString(2, "BAT-INS-5509");
                    pstmt.setInt(3, 8); // LOW STOCK
                    pstmt.setDouble(4, 48.90);
                    pstmt.setString(5, "2027-04-12");
                    pstmt.executeUpdate();

                    // 7. Omeprazole 20mg
                    pstmt.setString(1, "Omeprazole 20mg DR");
                    pstmt.setString(2, "BAT-OMP-3320");
                    pstmt.setInt(3, 65);
                    pstmt.setDouble(4, 11.20);
                    pstmt.setString(5, "2027-09-01");
                    pstmt.executeUpdate();

                    System.out.println("Sample pharmaceutical inventory seeded successfully.");
                }
            }
        } catch (SQLException e) {
            System.err.println("Error seeding initial data: " + e.getMessage());
        }
    }

    /**
     * Safely closes the active JDBC connection upon application termination.
     */
    public static synchronized void closeConnection() {
        if (connection != null) {
            try {
                if (!connection.isClosed()) {
                    connection.close();
                    System.out.println("H2 Database connection closed cleanly.");
                }
            } catch (SQLException e) {
                System.err.println("Error closing connection: " + e.getMessage());
            }
        }
    }
}`
  },
  {
    path: 'src/main/java/com/pharmacy/model/Medicine.java',
    name: 'Medicine.java',
    package: 'com.pharmacy.model',
    language: 'java',
    description: 'POJO model class encapsulating Medicine attributes: id, name, batch ID, stock quantity, price, and LocalDate expiry date',
    content: `package com.pharmacy.model;

import java.time.LocalDate;

/**
 * Data model representing a pharmaceutical inventory item.
 */
public class Medicine {

    private int id;
    private String name;
    private String batchId;
    private int stockQuantity;
    private double price;
    private LocalDate expiryDate;

    public Medicine() {
    }

    public Medicine(int id, String name, String batchId, int stockQuantity, double price, LocalDate expiryDate) {
        this.id = id;
        this.name = name;
        this.batchId = batchId;
        this.stockQuantity = stockQuantity;
        this.price = price;
        this.expiryDate = expiryDate;
    }

    public Medicine(String name, String batchId, int stockQuantity, double price, LocalDate expiryDate) {
        this.name = name;
        this.batchId = batchId;
        this.stockQuantity = stockQuantity;
        this.price = price;
        this.expiryDate = expiryDate;
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    @Override
    public String toString() {
        return name + " (" + batchId + ") - Qty: " + stockQuantity + " - $" + String.format("%.2f", price);
    }
}`
  },
  {
    path: 'src/main/java/com/pharmacy/model/Sale.java',
    name: 'Sale.java',
    package: 'com.pharmacy.model',
    language: 'java',
    description: 'POJO model class encapsulating a completed transaction row: id, medicine name, quantity, unit cost, total bill, and timestamp',
    content: `package com.pharmacy.model;

import java.time.LocalDateTime;

/**
 * Data model representing a transaction / sale record.
 */
public class Sale {

    private int id;
    private String medicineName;
    private int quantitySelected;
    private double unitCost;
    private double totalBill;
    private LocalDateTime transactionTimestamp;

    public Sale() {
    }

    public Sale(int id, String medicineName, int quantitySelected, double unitCost, double totalBill, LocalDateTime transactionTimestamp) {
        this.id = id;
        this.medicineName = medicineName;
        this.quantitySelected = quantitySelected;
        this.unitCost = unitCost;
        this.totalBill = totalBill;
        this.transactionTimestamp = transactionTimestamp;
    }

    public Sale(String medicineName, int quantitySelected, double unitCost, double totalBill) {
        this.medicineName = medicineName;
        this.quantitySelected = quantitySelected;
        this.unitCost = unitCost;
        this.totalBill = totalBill;
        this.transactionTimestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public int getQuantitySelected() {
        return quantitySelected;
    }

    public void setQuantitySelected(int quantitySelected) {
        this.quantitySelected = quantitySelected;
    }

    public double getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(double unitCost) {
        this.unitCost = unitCost;
    }

    public double getTotalBill() {
        return totalBill;
    }

    public void setTotalBill(double totalBill) {
        this.totalBill = totalBill;
    }

    public LocalDateTime getTransactionTimestamp() {
        return transactionTimestamp;
    }

    public void setTransactionTimestamp(LocalDateTime transactionTimestamp) {
        this.transactionTimestamp = transactionTimestamp;
    }
}`
  },
  {
    path: 'src/main/java/com/pharmacy/service/InventoryService.java',
    name: 'InventoryService.java',
    package: 'com.pharmacy.service',
    language: 'java',
    description: 'Alerts and Business Logic Service: scans low stock (quantity <= 10), evaluates near expiry (< 30 days) against local system date, executes queries and checkout transactions',
    content: `package com.pharmacy.service;

import com.pharmacy.db.DatabaseManager;
import com.pharmacy.model.Medicine;
import com.pharmacy.model.Sale;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Service layer for business logic, inventory filtering, alerts calculation,
 * and transactional operations.
 */
public class InventoryService {

    public static final int LOW_STOCK_THRESHOLD = 10;
    public static final int NEAR_EXPIRY_DAYS_THRESHOLD = 30;

    /**
     * Retrieves all medicines currently stored in the H2 database.
     */
    public List<Medicine> getAllMedicines() {
        List<Medicine> list = new ArrayList<>();
        String sql = "SELECT id, name, batch_id, stock_quantity, price, expiry_date FROM medicines ORDER BY name ASC";

        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Medicine med = new Medicine(
                    rs.getInt("id"),
                    rs.getString("name"),
                    rs.getString("batch_id"),
                    rs.getInt("stock_quantity"),
                    rs.getDouble("price"),
                    rs.getDate("expiry_date").toLocalDate()
                );
                list.add(med);
            }
        } catch (SQLException e) {
            System.err.println("Error fetching medicines: " + e.getMessage());
        }
        return list;
    }

    /**
     * Filters and returns medicines with stock quantity <= 10.
     */
    public List<Medicine> getLowStockMedicines() {
        List<Medicine> all = getAllMedicines();
        List<Medicine> lowStock = new ArrayList<>();
        for (Medicine m : all) {
            if (m.getStockQuantity() <= LOW_STOCK_THRESHOLD) {
                lowStock.add(m);
            }
        }
        return lowStock;
    }

    /**
     * Evaluates near-expiry status: medicines expiring in less than 30 days
     * relative to today's local system date.
     */
    public List<Medicine> getNearExpiryMedicines() {
        List<Medicine> all = getAllMedicines();
        List<Medicine> nearExpiry = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Medicine m : all) {
            long daysUntilExpiry = ChronoUnit.DAYS.between(today, m.getExpiryDate());
            // Items expiring within the next 30 days (including already expired items)
            if (daysUntilExpiry < NEAR_EXPIRY_DAYS_THRESHOLD) {
                nearExpiry.add(m);
            }
        }
        return nearExpiry;
    }

    /**
     * Inserts a new medicine record into the H2 database.
     * @return true if successfully inserted, false otherwise.
     */
    public boolean addMedicine(Medicine medicine) throws SQLException {
        String sql = "INSERT INTO medicines (name, batch_id, stock_quantity, price, expiry_date) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, medicine.getName().trim());
            pstmt.setString(2, medicine.getBatchId().trim());
            pstmt.setInt(3, medicine.getStockQuantity());
            pstmt.setDouble(4, medicine.getPrice());
            pstmt.setDate(5, Date.valueOf(medicine.getExpiryDate()));

            int rowsAffected = pstmt.executeUpdate();
            return rowsAffected > 0;
        }
    }

    /**
     * Atomically executes a sale checkout:
     * 1. Validates that current stock is sufficient.
     * 2. Decrements medicine stock quantity in 'medicines' table.
     * 3. Appends a transaction record to 'sales' table.
     * Uses JDBC transaction commit/rollback to guarantee ACID consistency.
     */
    public boolean processCheckout(String medicineName, int quantity, double unitCost, double totalBill) throws SQLException {
        Connection conn = DatabaseManager.getConnection();
        boolean originalAutoCommit = conn.getAutoCommit();

        try {
            conn.setAutoCommit(false); // Begin transaction

            // Step A: Check and lock active stock
            String checkStockSql = "SELECT stock_quantity FROM medicines WHERE name = ? FOR UPDATE";
            int currentStock = -1;
            try (PreparedStatement checkStmt = conn.prepareStatement(checkStockSql)) {
                checkStmt.setString(1, medicineName);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next()) {
                        currentStock = rs.getInt("stock_quantity");
                    } else {
                        throw new SQLException("Medicine not found in database: " + medicineName);
                    }
                }
            }

            if (currentStock < quantity) {
                throw new SQLException("Insufficient stock! Available: " + currentStock + ", Requested: " + quantity);
            }

            // Step B: Deduct stock quantity
            String updateStockSql = "UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE name = ?";
            try (PreparedStatement updateStmt = conn.prepareStatement(updateStockSql)) {
                updateStmt.setInt(1, quantity);
                updateStmt.setString(2, medicineName);
                updateStmt.executeUpdate();
            }

            // Step C: Record transaction in sales table
            String insertSaleSql = "INSERT INTO sales (medicine_name, quantity_selected, unit_cost, total_bill, transaction_timestamp) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement saleStmt = conn.prepareStatement(insertSaleSql)) {
                saleStmt.setString(1, medicineName);
                saleStmt.setInt(2, quantity);
                saleStmt.setDouble(3, unitCost);
                saleStmt.setDouble(4, totalBill);
                saleStmt.setTimestamp(5, Timestamp.valueOf(LocalDateTime.now()));
                saleStmt.executeUpdate();
            }

            conn.commit(); // Commit transaction
            return true;

        } catch (SQLException ex) {
            conn.rollback(); // Rollback on failure
            throw ex;
        } finally {
            conn.setAutoCommit(originalAutoCommit);
        }
    }

    /**
     * Retrieves all recorded sales transactions.
     */
    public List<Sale> getAllSales() {
        List<Sale> list = new ArrayList<>();
        String sql = "SELECT id, medicine_name, quantity_selected, unit_cost, total_bill, transaction_timestamp FROM sales ORDER BY id DESC";

        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Sale sale = new Sale(
                    rs.getInt("id"),
                    rs.getString("medicine_name"),
                    rs.getInt("quantity_selected"),
                    rs.getDouble("unit_cost"),
                    rs.getDouble("total_bill"),
                    rs.getTimestamp("transaction_timestamp").toLocalDateTime()
                );
                list.add(sale);
            }
        } catch (SQLException e) {
            System.err.println("Error fetching sales history: " + e.getMessage());
        }
        return list;
    }
}`
  },
  {
    path: 'src/main/java/com/pharmacy/ui/PharmacyGUI.java',
    name: 'PharmacyGUI.java',
    package: 'com.pharmacy.ui',
    language: 'java',
    description: 'Comprehensive JFrame Desktop GUI featuring JTabbedPane with 4 Tabs: Dashboard (KPI cards & alerts), Inventory Table, Add Medicine Panel, and Interactive Billing Terminal with live receipt transcript',
    content: `package com.pharmacy.ui;

import com.pharmacy.model.Medicine;
import com.pharmacy.model.Sale;
import com.pharmacy.service.InventoryService;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.TitledBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.ItemEvent;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Main Visual Desktop GUI for the Smart Pharmacy Management System.
 * Built with Java Swing using a 4-tab JTabbedPane architecture.
 */
public class PharmacyGUI extends JFrame {

    private final InventoryService inventoryService;

    // GUI Tabs container
    private JTabbedPane tabbedPane;

    // Tab A: Dashboard Components
    private JLabel totalItemsValueLabel;
    private JLabel lowStockValueLabel;
    private JLabel nearExpiryValueLabel;
    private JLabel totalSalesValueLabel;
    private DefaultTableModel lowStockTableModel;
    private DefaultTableModel nearExpiryTableModel;

    // Tab B: Inventory Table Components
    private JTable inventoryTable;
    private DefaultTableModel inventoryTableModel;
    private JTextField searchField;

    // Tab C: Add Medicine Form Components
    private JTextField nameField;
    private JTextField batchField;
    private JTextField stockField;
    private JTextField priceField;
    private JTextField expiryField;
    private JLabel addStatusLabel;

    // Tab D: Billing / Checkout Terminal Components
    private JComboBox<String> medicineDropdown;
    private JSpinner quantitySpinner;
    private JLabel unitPriceDisplayLabel;
    private JLabel availableStockLabel;
    private JLabel totalCostDisplayLabel;
    private JTextArea receiptTextArea;

    // Cached medicine list for fast dropdown & calculations
    private List<Medicine> cachedMedicines;

    public PharmacyGUI() {
        this.inventoryService = new InventoryService();

        setTitle("Smart Pharmacy Management System - Desktop Terminal (Java Swing & H2)");
        setSize(1080, 720);
        setMinimumSize(new Dimension(960, 640));
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null); // Center on screen

        initializeComponents();
        refreshAllData();
    }

    /**
     * Builds and attaches the top header, the 4-tab panel, and status bar.
     */
    private void initializeComponents() {
        setLayout(new BorderLayout());

        // 1. Top Application Banner
        JPanel headerPanel = createHeaderPanel();
        add(headerPanel, BorderLayout.NORTH);

        // 2. Core Tabbed Pane (4 Tabs)
        tabbedPane = new JTabbedPane();
        tabbedPane.setFont(new Font("Segoe UI", Font.BOLD, 13));

        // Tab A: Dashboard
        tabbedPane.addTab("  📊 Dashboard  ", createDashboardTab());

        // Tab B: Inventory View
        tabbedPane.addTab("  📦 Inventory View  ", createInventoryTab());

        // Tab C: Add Medicine Panel
        tabbedPane.addTab("  ➕ Add Medicine  ", createAddMedicineTab());

        // Tab D: Billing / Sales Terminal
        tabbedPane.addTab("  🛒 Billing Terminal  ", createBillingTab());

        add(tabbedPane, BorderLayout.CENTER);

        // 3. Bottom Status Bar
        JPanel statusBar = new JPanel(new BorderLayout());
        statusBar.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createMatteBorder(1, 0, 0, 0, new Color(210, 215, 220)),
            new EmptyBorder(6, 16, 6, 16)
        ));
        statusBar.setBackground(new Color(245, 247, 250));

        JLabel statusText = new JLabel("● Database: Embedded H2 Connected (jdbc:h2:./data/pharmacy_db) | Java Swing Engine Active");
        statusText.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        statusText.setForeground(new Color(40, 120, 60));

        JButton quickRefreshBtn = new JButton("↻ Refresh All");
        quickRefreshBtn.setFocusPainted(false);
        quickRefreshBtn.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        quickRefreshBtn.addActionListener(e -> refreshAllData());

        statusBar.add(statusText, BorderLayout.WEST);
        statusBar.add(quickRefreshBtn, BorderLayout.EAST);

        add(statusBar, BorderLayout.SOUTH);
    }

    /**
     * Top header with title, subtitle, and branding accent.
     */
    private JPanel createHeaderPanel() {
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(new Color(24, 43, 73));
        header.setBorder(new EmptyBorder(14, 20, 14, 20));

        JPanel textGroup = new JPanel(new GridLayout(2, 1, 0, 2));
        textGroup.setOpaque(false);

        JLabel titleLabel = new JLabel("Smart Pharmacy Management System");
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 20));
        titleLabel.setForeground(Color.WHITE);

        JLabel subtitleLabel = new JLabel("Enterprise Warehouse Inventory & Point-of-Sale Terminal • Java Swing & H2 Edition");
        subtitleLabel.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        subtitleLabel.setForeground(new Color(180, 205, 235));

        textGroup.add(titleLabel);
        textGroup.add(subtitleLabel);

        header.add(textGroup, BorderLayout.WEST);
        return header;
    }

    // ==========================================
    // TAB A: DASHBOARD
    // ==========================================
    private JPanel createDashboardTab() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBorder(new EmptyBorder(18, 18, 18, 18));
        panel.setBackground(new Color(245, 247, 250));

        // Top Row: 4 Metric Cards
        JPanel metricsPanel = new JPanel(new GridLayout(1, 4, 15, 0));
        metricsPanel.setOpaque(false);

        totalItemsValueLabel = new JLabel("0", SwingConstants.CENTER);
        lowStockValueLabel = new JLabel("0", SwingConstants.CENTER);
        nearExpiryValueLabel = new JLabel("0", SwingConstants.CENTER);
        totalSalesValueLabel = new JLabel("$0.00", SwingConstants.CENTER);

        metricsPanel.add(createKpiCard("TOTAL MEDICINES", totalItemsValueLabel, new Color(52, 101, 164), "Warehouse SKUs"));
        metricsPanel.add(createKpiCard("LOW STOCK (<=10)", lowStockValueLabel, new Color(204, 0, 0), "Action Required"));
        metricsPanel.add(createKpiCard("NEAR EXPIRY (<30d)", nearExpiryValueLabel, new Color(196, 110, 0), "Verify Batches"));
        metricsPanel.add(createKpiCard("REVENUE RECORDED", totalSalesValueLabel, new Color(34, 139, 34), "All Transactions"));

        panel.add(metricsPanel, BorderLayout.NORTH);

        // Center Area: Dual Alert Tables side by side
        JPanel alertsPanel = new JPanel(new GridLayout(1, 2, 15, 0));
        alertsPanel.setOpaque(false);

        // Left Alert Table: Low Stock Items
        lowStockTableModel = new DefaultTableModel(new String[]{"Medicine Name", "Batch ID", "Qty Left", "Unit Price"}, 0) {
            @Override
            public boolean isCellEditable(int row, int col) { return false; }
        };
        JTable lowStockTable = new JTable(lowStockTableModel);
        lowStockTable.setRowHeight(26);
        styleTableHeaders(lowStockTable);

        JScrollPane lowStockScroll = new JScrollPane(lowStockTable);
        lowStockScroll.setBorder(BorderFactory.createTitledBorder(
            BorderFactory.createLineBorder(new Color(230, 100, 100), 1),
            " ⚠️ Low Stock Alerts (Qty <= 10) ",
            TitledBorder.LEFT, TitledBorder.TOP,
            new Font("Segoe UI", Font.BOLD, 12), new Color(180, 0, 0)
        ));

        // Right Alert Table: Near Expiry Items
        nearExpiryTableModel = new DefaultTableModel(new String[]{"Medicine Name", "Batch ID", "Expiry Date", "Days Left"}, 0) {
            @Override
            public boolean isCellEditable(int row, int col) { return false; }
        };
        JTable nearExpiryTable = new JTable(nearExpiryTableModel);
        nearExpiryTable.setRowHeight(26);
        styleTableHeaders(nearExpiryTable);

        JScrollPane nearExpiryScroll = new JScrollPane(nearExpiryTable);
        nearExpiryScroll.setBorder(BorderFactory.createTitledBorder(
            BorderFactory.createLineBorder(new Color(230, 160, 50), 1),
            " ⏳ Near-Expiry Alerts (Expires < 30 Days) ",
            TitledBorder.LEFT, TitledBorder.TOP,
            new Font("Segoe UI", Font.BOLD, 12), new Color(180, 100, 0)
        ));

        alertsPanel.add(lowStockScroll);
        alertsPanel.add(nearExpiryScroll);

        panel.add(alertsPanel, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createKpiCard(String title, JLabel valueLabel, Color accentColor, String subtext) {
        JPanel card = new JPanel(new BorderLayout(5, 5));
        card.setBackground(Color.WHITE);
        card.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(220, 225, 230), 1),
            new EmptyBorder(12, 14, 12, 14)
        ));

        JLabel titleLbl = new JLabel(title);
        titleLbl.setFont(new Font("Segoe UI", Font.BOLD, 11));
        titleLbl.setForeground(accentColor);

        valueLabel.setFont(new Font("Segoe UI", Font.BOLD, 26));
        valueLabel.setForeground(new Color(30, 40, 50));

        JLabel subLbl = new JLabel(subtext, SwingConstants.CENTER);
        subLbl.setFont(new Font("Segoe UI", Font.PLAIN, 10));
        subLbl.setForeground(Color.GRAY);

        // Left accent stripe
        JPanel stripe = new JPanel();
        stripe.setPreferredSize(new Dimension(4, 50));
        stripe.setBackground(accentColor);

        card.add(titleLbl, BorderLayout.NORTH);
        card.add(valueLabel, BorderLayout.CENTER);
        card.add(subLbl, BorderLayout.SOUTH);

        JPanel wrapper = new JPanel(new BorderLayout());
        wrapper.add(stripe, BorderLayout.WEST);
        wrapper.add(card, BorderLayout.CENTER);
        return wrapper;
    }

    // ==========================================
    // TAB B: INVENTORY VIEW (JTable)
    // ==========================================
    private JPanel createInventoryTab() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBorder(new EmptyBorder(15, 15, 15, 15));
        panel.setBackground(new Color(245, 247, 250));

        // Toolbar with search and filter
        JPanel toolbar = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        toolbar.setBackground(Color.WHITE);
        toolbar.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(220, 225, 230), 1),
            new EmptyBorder(6, 10, 6, 10)
        ));

        JLabel searchLabel = new JLabel("🔍 Filter Inventory:");
        searchLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));

        searchField = new JTextField(20);
        searchField.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        searchField.addCaretListener(e -> filterInventoryTable());

        JButton clearFilterBtn = new JButton("Clear");
        clearFilterBtn.addActionListener(e -> {
            searchField.setText("");
            filterInventoryTable();
        });

        JButton refreshBtn = new JButton("🔄 Refresh Data");
        refreshBtn.addActionListener(e -> refreshAllData());

        toolbar.add(searchLabel);
        toolbar.add(searchField);
        toolbar.add(clearFilterBtn);
        toolbar.add(refreshBtn);

        panel.add(toolbar, BorderLayout.NORTH);

        // Inventory Table
        String[] columns = {"ID", "Medicine Name", "Batch ID", "Stock Qty", "Unit Price ($)", "Expiry Date", "Stock Status", "Expiry Status"};
        inventoryTableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int col) { return false; }
        };

        inventoryTable = new JTable(inventoryTableModel);
        inventoryTable.setRowHeight(28);
        inventoryTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        inventoryTable.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        styleTableHeaders(inventoryTable);

        // Center align numerical columns
        DefaultTableCellRenderer centerRenderer = new DefaultTableCellRenderer();
        centerRenderer.setHorizontalAlignment(SwingConstants.CENTER);
        inventoryTable.getColumnModel().getColumn(0).setCellRenderer(centerRenderer);
        inventoryTable.getColumnModel().getColumn(2).setCellRenderer(centerRenderer);
        inventoryTable.getColumnModel().getColumn(3).setCellRenderer(centerRenderer);
        inventoryTable.getColumnModel().getColumn(4).setCellRenderer(centerRenderer);
        inventoryTable.getColumnModel().getColumn(5).setCellRenderer(centerRenderer);
        inventoryTable.getColumnModel().getColumn(6).setCellRenderer(centerRenderer);
        inventoryTable.getColumnModel().getColumn(7).setCellRenderer(centerRenderer);

        inventoryTable.getColumnModel().getColumn(0).setPreferredWidth(40);
        inventoryTable.getColumnModel().getColumn(1).setPreferredWidth(180);
        inventoryTable.getColumnModel().getColumn(2).setPreferredWidth(100);

        JScrollPane scrollPane = new JScrollPane(inventoryTable);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(210, 215, 220), 1));
        panel.add(scrollPane, BorderLayout.CENTER);

        return panel;
    }

    // ==========================================
    // TAB C: ADD MEDICINE PANEL
    // ==========================================
    private JPanel createAddMedicineTab() {
        JPanel container = new JPanel(new GridBagLayout());
        container.setBackground(new Color(245, 247, 250));

        JPanel formCard = new JPanel(new GridBagLayout());
        formCard.setBackground(Color.WHITE);
        formCard.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(215, 222, 230), 1),
            new EmptyBorder(25, 35, 25, 35)
        ));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Title Header
        JLabel formTitle = new JLabel("Register New Pharmaceutical Product");
        formTitle.setFont(new Font("Segoe UI", Font.BOLD, 17));
        formTitle.setForeground(new Color(24, 43, 73));
        gbc.gridx = 0; gbc.gridy = 0; gbc.gridwidth = 2;
        formCard.add(formTitle, gbc);

        JLabel formSubtitle = new JLabel("Fields will be validated and committed to embedded H2 storage.");
        formSubtitle.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        formSubtitle.setForeground(Color.GRAY);
        gbc.gridy = 1;
        formCard.add(formSubtitle, gbc);

        gbc.gridwidth = 1;

        // Field 1: Medicine Name
        gbc.gridx = 0; gbc.gridy = 2;
        formCard.add(new JLabel("Medicine Name:"), gbc);
        nameField = new JTextField(20);
        gbc.gridx = 1;
        formCard.add(nameField, gbc);

        // Field 2: Batch ID
        gbc.gridx = 0; gbc.gridy = 3;
        formCard.add(new JLabel("Batch Number / ID:"), gbc);
        batchField = new JTextField(20);
        gbc.gridx = 1;
        formCard.add(batchField, gbc);

        // Field 3: Stock Quantity
        gbc.gridx = 0; gbc.gridy = 4;
        formCard.add(new JLabel("Initial Stock Quantity:"), gbc);
        stockField = new JTextField(20);
        gbc.gridx = 1;
        formCard.add(stockField, gbc);

        // Field 4: Unit Price ($)
        gbc.gridx = 0; gbc.gridy = 5;
        formCard.add(new JLabel("Unit Price ($):"), gbc);
        priceField = new JTextField(20);
        gbc.gridx = 1;
        formCard.add(priceField, gbc);

        // Field 5: Expiry Date (YYYY-MM-DD)
        gbc.gridx = 0; gbc.gridy = 6;
        formCard.add(new JLabel("Expiry Date (YYYY-MM-DD):"), gbc);
        expiryField = new JTextField(20);
        expiryField.setText(LocalDate.now().plusYears(1).format(DateTimeFormatter.ISO_LOCAL_DATE));
        gbc.gridx = 1;
        formCard.add(expiryField, gbc);

        // Status Feedback Message
        addStatusLabel = new JLabel(" ");
        addStatusLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        gbc.gridx = 0; gbc.gridy = 7; gbc.gridwidth = 2;
        formCard.add(addStatusLabel, gbc);

        // Action Buttons Row
        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        btnPanel.setOpaque(false);

        JButton clearBtn = new JButton("Clear Form");
        clearBtn.addActionListener(e -> clearAddMedicineForm());

        JButton saveBtn = new JButton("💾 Save to Inventory");
        saveBtn.setBackground(new Color(24, 120, 60));
        saveBtn.setForeground(Color.WHITE);
        saveBtn.setFocusPainted(false);
        saveBtn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        saveBtn.addActionListener(e -> handleAddMedicineSubmit());

        btnPanel.add(clearBtn);
        btnPanel.add(saveBtn);

        gbc.gridx = 0; gbc.gridy = 8; gbc.gridwidth = 2;
        formCard.add(btnPanel, gbc);

        container.add(formCard);
        return container;
    }

    private void handleAddMedicineSubmit() {
        String name = nameField.getText().trim();
        String batch = batchField.getText().trim();
        String stockStr = stockField.getText().trim();
        String priceStr = priceField.getText().trim();
        String expiryStr = expiryField.getText().trim();

        if (name.isEmpty() || batch.isEmpty() || stockStr.isEmpty() || priceStr.isEmpty() || expiryStr.isEmpty()) {
            addStatusLabel.setForeground(Color.RED);
            addStatusLabel.setText("❌ Please fill out all required fields.");
            return;
        }

        int quantity;
        double price;
        LocalDate expiryDate;

        try {
            quantity = Integer.parseInt(stockStr);
            if (quantity < 0) throw new NumberFormatException("Quantity must be >= 0");
        } catch (NumberFormatException ex) {
            addStatusLabel.setForeground(Color.RED);
            addStatusLabel.setText("❌ Stock quantity must be a non-negative integer.");
            return;
        }

        try {
            price = Double.parseDouble(priceStr);
            if (price < 0) throw new NumberFormatException("Price must be >= 0");
        } catch (NumberFormatException ex) {
            addStatusLabel.setForeground(Color.RED);
            addStatusLabel.setText("❌ Unit price must be a valid positive number.");
            return;
        }

        try {
            expiryDate = LocalDate.parse(expiryStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException ex) {
            addStatusLabel.setForeground(Color.RED);
            addStatusLabel.setText("❌ Invalid Date format. Please use YYYY-MM-DD.");
            return;
        }

        Medicine newMed = new Medicine(name, batch, quantity, price, expiryDate);

        try {
            boolean success = inventoryService.addMedicine(newMed);
            if (success) {
                addStatusLabel.setForeground(new Color(0, 130, 40));
                addStatusLabel.setText("✔ Successfully added '" + name + "' to H2 database!");
                clearAddMedicineForm();
                refreshAllData();

                JOptionPane.showMessageDialog(this, 
                    "Medicine record successfully saved to database!", 
                    "Success", JOptionPane.INFORMATION_MESSAGE);
            }
        } catch (SQLException ex) {
            addStatusLabel.setForeground(Color.RED);
            addStatusLabel.setText("❌ Database error: " + ex.getMessage());
            JOptionPane.showMessageDialog(this, 
                "Failed to insert medicine: " + ex.getMessage(), 
                "Database Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void clearAddMedicineForm() {
        nameField.setText("");
        batchField.setText("");
        stockField.setText("");
        priceField.setText("");
        expiryField.setText(LocalDate.now().plusYears(1).format(DateTimeFormatter.ISO_LOCAL_DATE));
    }

    // ==========================================
    // TAB D: BILLING / SALES TERMINAL
    // ==========================================
    private JPanel createBillingTab() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBorder(new EmptyBorder(15, 15, 15, 15));
        panel.setBackground(new Color(245, 247, 250));

        // Left Column: Interactive Order Selection Form
        JPanel leftPanel = new JPanel(new GridBagLayout());
        leftPanel.setBackground(Color.WHITE);
        leftPanel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createTitledBorder(
                BorderFactory.createLineBorder(new Color(210, 215, 220), 1),
                " Point-of-Sale Checkout ",
                TitledBorder.LEFT, TitledBorder.TOP,
                new Font("Segoe UI", Font.BOLD, 13), new Color(24, 43, 73)
            ),
            new EmptyBorder(15, 15, 15, 15)
        ));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Medicine selector
        gbc.gridx = 0; gbc.gridy = 0;
        leftPanel.add(new JLabel("Select Medicine:"), gbc);
        medicineDropdown = new JComboBox<>();
        medicineDropdown.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        medicineDropdown.addItemListener(e -> {
            if (e.getStateChange() == ItemEvent.SELECTED) {
                updateBillingCalculations();
            }
        });
        gbc.gridx = 1;
        leftPanel.add(medicineDropdown, gbc);

        // Available stock display
        gbc.gridx = 0; gbc.gridy = 1;
        leftPanel.add(new JLabel("Available Stock:"), gbc);
        availableStockLabel = new JLabel("0 units");
        availableStockLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        gbc.gridx = 1;
        leftPanel.add(availableStockLabel, gbc);

        // Unit Price display
        gbc.gridx = 0; gbc.gridy = 2;
        leftPanel.add(new JLabel("Unit Price:"), gbc);
        unitPriceDisplayLabel = new JLabel("$0.00");
        unitPriceDisplayLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        gbc.gridx = 1;
        leftPanel.add(unitPriceDisplayLabel, gbc);

        // Purchase Quantity Spinner
        gbc.gridx = 0; gbc.gridy = 3;
        leftPanel.add(new JLabel("Purchase Quantity:"), gbc);
        quantitySpinner = new JSpinner(new SpinnerNumberModel(1, 1, 9999, 1));
        quantitySpinner.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        quantitySpinner.addChangeListener(e -> updateBillingCalculations());
        gbc.gridx = 1;
        leftPanel.add(quantitySpinner, gbc);

        // Total Cost Display
        gbc.gridx = 0; gbc.gridy = 4;
        leftPanel.add(new JLabel("Total Amount:"), gbc);
        totalCostDisplayLabel = new JLabel("$0.00");
        totalCostDisplayLabel.setFont(new Font("Segoe UI", Font.BOLD, 18));
        totalCostDisplayLabel.setForeground(new Color(24, 120, 60));
        gbc.gridx = 1;
        leftPanel.add(totalCostDisplayLabel, gbc);

        // Checkout Button
        JButton checkoutBtn = new JButton("💳 Complete Checkout & Print Receipt");
        checkoutBtn.setBackground(new Color(24, 120, 60));
        checkoutBtn.setForeground(Color.WHITE);
        checkoutBtn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        checkoutBtn.setFocusPainted(false);
        checkoutBtn.addActionListener(e -> handleCheckout());
        gbc.gridx = 0; gbc.gridy = 5; gbc.gridwidth = 2;
        gbc.insets = new Insets(15, 8, 8, 8);
        leftPanel.add(checkoutBtn, gbc);

        // Right Column: Scrollable JTextArea for Receipt Transcript
        JPanel rightPanel = new JPanel(new BorderLayout());
        rightPanel.setBorder(BorderFactory.createTitledBorder(
            BorderFactory.createLineBorder(new Color(210, 215, 220), 1),
            " Thermal Receipt Transcript ",
            TitledBorder.LEFT, TitledBorder.TOP,
            new Font("Segoe UI", Font.BOLD, 13), new Color(24, 43, 73)
        ));

        receiptTextArea = new JTextArea();
        receiptTextArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        receiptTextArea.setEditable(false);
        receiptTextArea.setBackground(new Color(254, 254, 250));
        receiptTextArea.setText(
            "=========================================\\n" +
            "       SMART PHARMACY TERMINAL          \\n" +
            "       UNIVERSITY CLINICAL POS          \\n" +
            "=========================================\\n" +
            "  Select a medicine and quantity to begin\\n" +
            "  billing. Transaction receipts will be  \\n" +
            "  transcribed here automatically.        \\n" +
            "=========================================\\n"
        );

        JScrollPane receiptScroll = new JScrollPane(receiptTextArea);
        rightPanel.add(receiptScroll, BorderLayout.CENTER);

        // Split view
        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, leftPanel, rightPanel);
        splitPane.setDividerLocation(420);
        panel.add(splitPane, BorderLayout.CENTER);

        return panel;
    }

    private void updateBillingCalculations() {
        int selectedIndex = medicineDropdown.getSelectedIndex();
        if (selectedIndex < 0 || cachedMedicines == null || selectedIndex >= cachedMedicines.size()) {
            availableStockLabel.setText("0 units");
            unitPriceDisplayLabel.setText("$0.00");
            totalCostDisplayLabel.setText("$0.00");
            return;
        }

        Medicine selectedMed = cachedMedicines.get(selectedIndex);
        availableStockLabel.setText(selectedMed.getStockQuantity() + " units");
        if (selectedMed.getStockQuantity() <= InventoryService.LOW_STOCK_THRESHOLD) {
            availableStockLabel.setForeground(Color.RED);
        } else {
            availableStockLabel.setForeground(new Color(0, 120, 0));
        }

        unitPriceDisplayLabel.setText(String.format("$%.2f", selectedMed.getPrice()));

        int qty = (Integer) quantitySpinner.getValue();
        double total = qty * selectedMed.getPrice();
        totalCostDisplayLabel.setText(String.format("$%.2f", total));
    }

    private void handleCheckout() {
        int selectedIndex = medicineDropdown.getSelectedIndex();
        if (selectedIndex < 0 || cachedMedicines == null || selectedIndex >= cachedMedicines.size()) {
            JOptionPane.showMessageDialog(this, "Please select a valid medicine.", "Selection Error", JOptionPane.WARNING_MESSAGE);
            return;
        }

        Medicine med = cachedMedicines.get(selectedIndex);
        int qty = (Integer) quantitySpinner.getValue();

        if (qty <= 0) {
            JOptionPane.showMessageDialog(this, "Purchase quantity must be at least 1.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            return;
        }

        if (qty > med.getStockQuantity()) {
            JOptionPane.showMessageDialog(this, 
                "Insufficient stock! Only " + med.getStockQuantity() + " units available.", 
                "Stock Shortage", JOptionPane.ERROR_MESSAGE);
            return;
        }

        double total = qty * med.getPrice();

        try {
            boolean success = inventoryService.processCheckout(med.getName(), qty, med.getPrice(), total);
            if (success) {
                // Generate Receipt Transcript
                String receipt = generateReceiptTranscript(med, qty, total);
                receiptTextArea.setText(receipt);

                // Show confirmation and update active tables
                JOptionPane.showMessageDialog(this, 
                    "Checkout completed successfully!\\nTotal: $" + String.format("%.2f", total), 
                    "Transaction Approved", JOptionPane.INFORMATION_MESSAGE);

                refreshAllData();
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, 
                "Checkout failed: " + ex.getMessage(), 
                "Transaction Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private String generateReceiptTranscript(Medicine med, int qty, double total) {
        StringBuilder sb = new StringBuilder();
        String dateStr = java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        int receiptNo = (int) (System.currentTimeMillis() % 1000000);

        sb.append("=========================================\\n");
        sb.append("        SMART PHARMACY OUTLET            \\n");
        sb.append("     University Healthcare System        \\n");
        sb.append("=========================================\\n");
        sb.append(String.format(" Receipt #: REC-%06d\\n", receiptNo));
        sb.append(String.format(" Date/Time: %s\\n", dateStr));
        sb.append(String.format(" Cashier  : POS-DESKTOP-TERMINAL\\n"));
        sb.append("-----------------------------------------\\n");
        sb.append(String.format(" Item: %s\\n", med.getName()));
        sb.append(String.format(" Batch: %s | Expiry: %s\\n", med.getBatchId(), med.getExpiryDate()));
        sb.append(String.format(" Quantity: %d x $%.2f\\n", qty, med.getPrice()));
        sb.append("-----------------------------------------\\n");
        sb.append(String.format(" SUB-TOTAL : $%.2f\\n", total));
        sb.append(String.format(" TAX (0%%)  : $0.00\\n"));
        sb.append(String.format(" TOTAL DUE : $%.2f\\n", total));
        sb.append("=========================================\\n");
        sb.append(String.format(" PAYMENT   : APPROVED (CASH/CARD)\\n"));
        sb.append(String.format(" STATUS    : H2 DB STOCK UPDATED\\n"));
        sb.append("=========================================\\n");
        sb.append("   Thank you for your visit! Stay well.  \\n");
        sb.append("=========================================\\n");
        return sb.toString();
    }

    // ==========================================
    // REFRESH & SYNCHRONIZATION LOGIC
    // ==========================================
    public void refreshAllData() {
        cachedMedicines = inventoryService.getAllMedicines();
        List<Medicine> lowStockList = inventoryService.getLowStockMedicines();
        List<Medicine> nearExpiryList = inventoryService.getNearExpiryMedicines();
        List<Sale> allSales = inventoryService.getAllSales();

        // 1. Update Tab A Dashboard KPIs
        totalItemsValueLabel.setText(String.valueOf(cachedMedicines.size()));
        lowStockValueLabel.setText(String.valueOf(lowStockList.size()));
        nearExpiryValueLabel.setText(String.valueOf(nearExpiryList.size()));

        double totalSalesSum = 0;
        for (Sale s : allSales) {
            totalSalesSum += s.getTotalBill();
        }
        totalSalesValueLabel.setText(String.format("$%.2f", totalSalesSum));

        // Update Dashboard Low Stock Table
        lowStockTableModel.setRowCount(0);
        for (Medicine m : lowStockList) {
            lowStockTableModel.addRow(new Object[]{
                m.getName(), m.getBatchId(), m.getStockQuantity(), String.format("$%.2f", m.getPrice())
            });
        }

        // Update Dashboard Near Expiry Table
        nearExpiryTableModel.setRowCount(0);
        LocalDate today = LocalDate.now();
        for (Medicine m : nearExpiryList) {
            long days = ChronoUnit.DAYS.between(today, m.getExpiryDate());
            String daysText = days < 0 ? "EXPIRED (" + Math.abs(days) + "d ago)" : days + " days";
            nearExpiryTableModel.addRow(new Object[]{
                m.getName(), m.getBatchId(), m.getExpiryDate(), daysText
            });
        }

        // 2. Update Tab B Inventory Table
        filterInventoryTable();

        // 3. Update Tab D Dropdown
        String currentSelection = (String) medicineDropdown.getSelectedItem();
        medicineDropdown.removeAllItems();
        int restoreIdx = 0;
        for (int i = 0; i < cachedMedicines.size(); i++) {
            Medicine m = cachedMedicines.get(i);
            String itemText = m.getName() + " [Stock: " + m.getStockQuantity() + "]";
            medicineDropdown.addItem(itemText);
            if (currentSelection != null && currentSelection.startsWith(m.getName())) {
                restoreIdx = i;
            }
        }
        if (!cachedMedicines.isEmpty()) {
            medicineDropdown.setSelectedIndex(restoreIdx);
        }
        updateBillingCalculations();
    }

    private void filterInventoryTable() {
        if (cachedMedicines == null) return;
        String query = searchField != null ? searchField.getText().trim().toLowerCase() : "";
        LocalDate today = LocalDate.now();

        inventoryTableModel.setRowCount(0);
        for (Medicine m : cachedMedicines) {
            if (!query.isEmpty() && !m.getName().toLowerCase().contains(query) && !m.getBatchId().toLowerCase().contains(query)) {
                continue;
            }

            String stockStatus = m.getStockQuantity() <= InventoryService.LOW_STOCK_THRESHOLD ? "⚠️ LOW STOCK" : "✔ OK";
            long days = ChronoUnit.DAYS.between(today, m.getExpiryDate());
            String expiryStatus;
            if (days < 0) {
                expiryStatus = "⛔ EXPIRED";
            } else if (days < InventoryService.NEAR_EXPIRY_DAYS_THRESHOLD) {
                expiryStatus = "⏳ NEAR (" + days + "d)";
            } else {
                expiryStatus = "✔ VALID";
            }

            inventoryTableModel.addRow(new Object[]{
                m.getId(),
                m.getName(),
                m.getBatchId(),
                m.getStockQuantity(),
                String.format("%.2f", m.getPrice()),
                m.getExpiryDate().toString(),
                stockStatus,
                expiryStatus
            });
        }
    }

    private void styleTableHeaders(JTable table) {
        table.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 12));
        table.getTableHeader().setBackground(new Color(230, 235, 242));
        table.getTableHeader().setForeground(new Color(30, 45, 65));
    }
}`
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    description: 'Complete build, run, and university presentation guide with Maven commands and architecture overview',
    content: `# Smart Pharmacy Management System

A production-grade Desktop GUI Application built in **Java 11+** with **Java Swing** and an embedded **H2 Database**.

---

## 📁 Project Directory Structure
\`\`\`
smart-pharmacy-system/
│
├── pom.xml                                      # Maven configuration & H2 dependencies
│
└── src/
    └── main/
        └── java/
            └── com/
                └── pharmacy/
                    ├── Main.java                # Main entry point & Look and Feel
                    │
                    ├── db/
                    │   └── DatabaseManager.java # H2 Embedded JDBC connection & tables
                    │
                    ├── model/
                    │   ├── Medicine.java        # Inventory Item Entity
                    │   └── Sale.java            # POS Sale / Transaction Entity
                    │
                    ├── service/
                    │   └── InventoryService.java # Alerts logic (<=10 qty, <30 days expiry)
                    │
                    └── ui/
                        └── PharmacyGUI.java     # 4-Tab Swing Desktop Application
\`\`\`

---

## 🚀 How to Compile and Run

### Prerequisites
- **JDK 11 or higher** installed (\`java -version\`)
- **Apache Maven 3.6+** installed (\`mvn -version\`)

### 1. Compile the Project
Open a terminal in the project root directory and execute:
\`\`\`bash
mvn clean compile
\`\`\`

### 2. Run the Application Immediately
\`\`\`bash
mvn exec:java
\`\`\`

### 3. Package into a Standalone Executable Fat JAR
\`\`\`bash
mvn clean package
java -jar target/smart-pharmacy-system-1.0.0.jar
\`\`\`

---

## 🗄️ Database Architecture (Embedded H2)
- **Engine**: H2 Database Engine 2.2.x (In-Process Embedded mode)
- **Storage Location**: Automatically saved to \`./data/pharmacy_db.mv.db\` in the project directory.
- **Auto Server Enabled**: You can simultaneously inspect tables using the H2 Web Console.
- **Auto Bootstrap**: Schema creation for \`medicines\` and \`sales\` runs on the first application startup.

---

## 🖥️ Core Functional Modules
1. **Dashboard**: High-level KPI indicators showing total SKUs, low-stock count, near-expiry count, and revenue.
2. **Inventory View**: Dynamic JTable showing active stock, unit prices, expiry dates, and real-time alert tags.
3. **Add Medicine Panel**: Input validation, price and date parsers, and atomic insert into H2.
4. **Billing / POS Terminal**: Interactive checkout with live item cost multiplication, atomic stock deduction, and thermal receipt transcript printer.
`
  }
];
