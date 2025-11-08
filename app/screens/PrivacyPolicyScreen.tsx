import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';

type PrivacyPolicyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

interface PrivacyPolicyScreenProps {
  navigation: PrivacyPolicyScreenNavigationProp;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Image
            source={require('../assets/USBGF_com_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="USBGF Logo"
          />
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.updatedDate}>Updated October 2023</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Protecting Your Privacy</Text>
          <Text style={styles.paragraph}>
            The U.S. Backgammon Federation (USBGF) has established this Privacy Policy to explain how your information is protected, collected, and used. The Privacy Policy may be updated by the USBGF at its sole discretion and without notice.
          </Text>
          
          <Text style={styles.paragraph}>
            We do not resell or share your information, including your email address, with third parties for commercial marketing purposes.
          </Text>
          
          <Text style={styles.paragraph}>
            We do not engage in cross-marketing or link-referral programs with other sites.
          </Text>
          
          <Text style={styles.paragraph}>
            We employ some tracking devices such as cookies and single-pixel gifs for analytics tracking and our own social media marketing purposes.
          </Text>
          
          <Text style={styles.paragraph}>
            Account information is password-protected. Keep your password safe.
          </Text>
          
          <Text style={styles.paragraph}>
            The USBGF, or people who post on the website, may provide links to third-party websites, which may have different privacy practices. We are not responsible for, nor have any control over, the privacy policies of those third-party website, and encourage all users to read the privacy policies of each and every website visited.
          </Text>

          <Text style={styles.sectionTitle}>Data We Collect</Text>
          <Text style={styles.paragraph}>
            As part of the registration and enrollment process, we collect personal information, including your name, username, email address, and password ("Personal Information"). You may also choose to submit your mailing address, telephone number, gender, year of birth, and backgammon club affiliation. We may use any Personal Information that you submit to disseminate mailings related to the USBGF or the website and to ascertain your eligibility for USBGF benefits, such as added money at ABT tournaments. We may also use Personal Information to identify and prevent unlawful or inappropriate use of the website.
          </Text>
          
          <Text style={styles.paragraph}>
            Our web logs collect standard web log entries for each page served, including your IP address, page URL, and timestamp.
          </Text>

          <Text style={styles.sectionTitle}>Use of Data</Text>
          <Text style={styles.paragraph}>
            We use your membership data (name, email address and/or postal address) only for the purposes of administration of membership. This includes adding you to the circulation list of our e-alerts. You may choose to unsubscribe from our e-alerts at any time.
          </Text>
          
          <Text style={styles.paragraph}>
            We provide membership information to tournament directors of USBGF-affiliated events such as directors of the American Backgammon Tour and directors of local backgammon clubs. This information is provided for directors to determine your eligibility to compete in those events and receive added money or benefits. We do not provide membership data to other individuals or organizations.
          </Text>
          
          <Text style={styles.paragraph}>
            No data is transferred between our membership and ratings databases, except to indicate current membership status of rated players. You should be aware that most tournament directors will submit their results to the USBGF for ratings purposes, and that these results will be published online and remain indefinitely as an historical record.
          </Text>

          <Text style={styles.sectionTitle}>Data We Store</Text>
          <Text style={styles.paragraph}>
            All Personal Information entered as part of the registration and enrollment process is stored in our database.
          </Text>
          
          <Text style={styles.paragraph}>
            Our web logs and other records are stored indefinitely.
          </Text>
          
          <Text style={styles.paragraph}>
            Although we make good faith efforts to store the information in a secure operating environment that is not available to the public, we cannot guarantee complete security.
          </Text>

          <Text style={styles.sectionTitle}>Circumstances in which the USBGF may release information</Text>
          <Text style={styles.paragraph}>
            The USBGF may disclose information about its users if required to do so by law or in the good faith belief that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process.
          </Text>
          
          <Text style={styles.paragraph}>
            The USBGF may also disclose information about its users to law enforcement officers or others, in the good faith belief that such disclosure is reasonably necessary to: enforce our Terms of Use; respond to claims that any posting or other content violates the rights of third-parties; or protect the rights, property, or personal safety of the USBGF, its members or the general public.
          </Text>

          <Text style={styles.sectionTitle}>Media</Text>
          <Text style={styles.paragraph}>
            If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website.
          </Text>

          <Text style={styles.sectionTitle}>Accessing and Updating Personal Information</Text>
          <Text style={styles.paragraph}>
            When you use the website, we make good faith efforts to provide you with access to your personal information and either to correct this data if it is inaccurate or to delete such data at your request if it is not otherwise required to be retained by law or for legitimate business purposes. We ask individual users to identify themselves and the information requested to be accessed, corrected or removed before processing such requests, and we may decline to process requests that are unreasonably repetitive or systematic, require disproportionate technical effort, jeopardize the privacy of others, or would be extremely impractical (for instance, requests concerning information residing on backup tapes), or for which access is not otherwise required. In any case where we provide information access and correction, we perform this service free of charge, except if doing so would require a disproportionate effort.
          </Text>

          <Text style={styles.sectionTitle}>Embedded Content From Other Websites</Text>
          <Text style={styles.paragraph}>
            Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.
          </Text>
          
          <Text style={styles.paragraph}>
            These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.
          </Text>

          <Text style={styles.sectionTitle}>Email Messages and Unsubscribing</Text>
          <Text style={styles.paragraph}>
            The USBGF uses your contact information to send you transactional emails related to your interactions with our services, such as messages regarding your membership payment and status and customer support communications. Players entering a USBGF sanctioned event will receive procedural email updates related to that event.
          </Text>
          
          <Text style={styles.paragraph}>
            With your consent, we use your contact information to send you marketing emails such as newsletters, tournament alerts, organizational updates, and promotional offers that may be of interest to you. You may unsubscribe from marketing emails at any time by clicking on the email preferences link.
          </Text>

          <Text style={styles.sectionTitle}>Text Messages and Opting Out</Text>
          <Text style={styles.paragraph}>
            By registering for a USBGF sanctioned tournament and providing your mobile number, you consent to receive SMS messages from us related to your tournament participation. We use your mobile number to provide time-sensitive tournament updates. You can opt out anytime via your USBGF Online Tournament System profile page.
          </Text>

          <Text style={styles.sectionTitle}>Cookies</Text>
          <Text style={styles.paragraph}>
            If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser.
          </Text>
          
          <Text style={styles.paragraph}>
            When you log in, we will also set up several cookies to save your login information and your screen display choices. If you select "Remember Me", your login will persist for a period of time. If you log out of your account, the login cookies will be removed.
          </Text>

          <Text style={styles.sectionTitle}>International Users</Text>
          <Text style={styles.paragraph}>
            By visiting our website and providing us with data, including Personal Information, you acknowledge and agree that we may use the data collected in the course of our relationship for the purposes identified in this Privacy Policy or in our other communications with you, including the transmission of information outside your resident jurisdiction. In addition, please understand that such data may be stored on servers located in the United States. By providing us with your data, you consent to the transfer of such data.
          </Text>

          <Text style={styles.sectionTitle}>Enforcement</Text>
          <Text style={styles.paragraph}>
            Please feel free to direct any questions or concerns regarding this Privacy Policy or the USBGF's treatment of personal information by contacting us through this website or by writing to us at hello@usbgf.org.
          </Text>
          
          <Text style={styles.paragraph}>
            When we receive formal written complaints at this address, it is the USBGF's policy to contact the complaining user regarding his or her concerns. We will cooperate with the appropriate regulatory authorities, including local data protection authorities, to resolve any complaints regarding the transfer of personal data that cannot be resolved between the USBGF and an individual.
          </Text>

          <Text style={styles.sectionTitle}>Changes to this Privacy Policy</Text>
          <Text style={styles.paragraph}>
            Please note that this Privacy Policy may change from time to time without notice. We will post any Privacy Policy changes on this page. If you have any additional questions or concerns about this Privacy Policy, please feel free to contact us.
          </Text>

          <Text style={styles.footerText}>
            © 2025 - U.S. Backgammon Federation
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing['3xl'],
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing['2xl'],
  },
  logo: {
    width: 120,
    height: 72,
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  updatedDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  contentContainer: {
    paddingBottom: theme.spacing['4xl'],
  },
  sectionTitle: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing.lg,
  },
  paragraph: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing['3xl'],
    fontStyle: 'italic',
  },
});



