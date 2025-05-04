import styles from "@/app/ui/dashboard/help/help.module.css";
import { MdExpandMore, MdSearch } from "react-icons/md";

const HelpPage = () => {
  const faqs = [
    {
      question: "How do I add a new model?",
      answer: "You can add a new model by navigating to the Models page and clicking on the 'Add New' button. Fill in all the required fields and upload your model file."
    },
    {
      question: "How do I connect an edge device?",
      answer: "To connect an edge device, go to the Edge Devices page and click 'Add New Device'. Follow the setup wizard to configure your device and establish the connection."
    },
    {
      question: "How can I view real-time analytics?",
      answer: "Real-time analytics can be viewed on the Real-time Data page. You'll see live updates from all connected devices and can filter data based on various parameters."
    },
    {
      question: "How do I set up user permissions?",
      answer: "User permissions can be managed in the Users section. Select a user and click on 'Edit Permissions' to assign different access levels and capabilities."
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Help Center</h1>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <MdSearch className={styles.searchIcon} />
          <input type="text" placeholder="Search for help topics..." />
          <button className={styles.searchButton}>Search</button>
        </div>
      </div>

      <div className={styles.categories}>
        <div className={styles.category}>Getting Started</div>
        <div className={styles.category}>Models</div>
        <div className={styles.category}>Edge Devices</div>
        <div className={styles.category}>Analytics</div>
        <div className={styles.category}>Account</div>
      </div>

      <div className={styles.faqSection}>
        <h2>Frequently Asked Questions</h2>
        
        <div className={styles.faqs}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <div className={styles.faqQuestion}>
                <h3>{faq.question}</h3>
                <MdExpandMore className={styles.expandIcon} />
              </div>
              <div className={styles.faqAnswer}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.supportSection}>
        <h2>Need more help?</h2>
        <p>Our support team is available 24/7 to assist you with any questions or issues.</p>
        <div className={styles.supportOptions}>
          <button className={styles.supportButton}>Contact Support</button>
          <button className={styles.docsButton}>Documentation</button>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
