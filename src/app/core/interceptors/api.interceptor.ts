import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

function translateMessageToFr(message: string): string {
  if (!message) return message;

  const direct: Record<string, string> = {
    // Auth
    'Validation failed': 'Validation échouée',
    'Email already registered': 'Cet email est déjà enregistré',
    'Invalid or expired verification token': 'Lien de vérification invalide ou expiré',
    'No account found with this email': 'Aucun compte trouvé avec cet email',
    'Email is already verified': 'L\'email est déjà vérifié',
    'Invalid email or password': 'Email ou mot de passe incorrect',
    'Please verify your email before logging in': 'Veuillez vérifier votre email avant de vous connecter',
    'Please verify your email first': 'Veuillez d\'abord vérifier votre email',
    'Your account has been deactivated. Please contact administrator.': 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.',
    'Your account is pending approval. Please wait for admin validation.': 'Votre compte est en attente d\'approbation. Veuillez attendre la validation par l\'administrateur.',
    'Your account has been blocked. Please contact administrator.': 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.',
    'Account locked due to too many failed attempts. Try again in 15 minutes.': 'Compte verrouillé après trop de tentatives. Réessayez dans 15 minutes.',
    'Failed to send OTP. Please try again.': 'Envoi du code OTP impossible. Veuillez réessayer.',
    'User not found': 'Utilisateur introuvable',
    'No OTP requested. Please login again.': 'Aucun code OTP demandé. Veuillez vous reconnecter.',
    'Too many failed attempts. Please login again.': 'Trop de tentatives échouées. Veuillez vous reconnecter.',
    'Current password is incorrect': 'Le mot de passe actuel est incorrect',
    'Boutique already in favorites': 'Boutique déjà dans les favoris',
    'Boutique not in favorites': 'Boutique absente des favoris',
    'You cannot change your own status': 'Vous ne pouvez pas modifier votre propre statut',
    'User is already active': 'L\'utilisateur est déjà actif',
    'User has not verified their email yet': 'L\'utilisateur n\'a pas encore vérifié son email',
    'You cannot block your own account': 'Vous ne pouvez pas bloquer votre propre compte',
    'Cannot block an admin account': 'Impossible de bloquer un compte administrateur',
    'User is not blocked': 'L\'utilisateur n\'est pas bloqué',
    'Failed to send reset email. Please try again later.': 'Envoi de l\'email de réinitialisation impossible. Veuillez réessayer plus tard.',
    'Invalid or expired reset token. Please request a new password reset.': 'Lien de réinitialisation invalide ou expiré. Demandez une nouvelle réinitialisation.',
    // Boutique
    'Boutique not found': 'Boutique introuvable',
    'You can only create a boutique for your own account': 'Vous ne pouvez créer une boutique que pour votre propre compte',
    'This user already has a boutique': 'Cet utilisateur possède déjà une boutique',
    'Invalid categoryId': 'Identifiant de catégorie invalide',
    'Invalid userId': 'Identifiant utilisateur invalide',
    'You can only update your own boutique': 'Vous ne pouvez modifier que votre propre boutique',
    'Only admin can reject a boutique': 'Seul l\'administrateur peut refuser une boutique',
    'Only admin or owner can set inactive': 'Seul l\'administrateur ou le propriétaire peut désactiver',
    'Invalid status. Use: pending, active, inactive, rejected': 'Statut invalide. Utilisez : pending, active, inactive, rejected',
    'You can only update your own boutique location': 'Vous ne pouvez modifier que l\'emplacement de votre propre boutique',
    'You can only delete your own boutique': 'Vous ne pouvez supprimer que votre propre boutique',
    // Category
    'Category not found': 'Catégorie introuvable',
    'Parent category not found': 'Catégorie parente introuvable',
    'A category with this name already exists': 'Une catégorie avec ce nom existe déjà',
    'Cannot create a subcategory of a subcategory. Maximum depth is 2 levels.': 'Impossible de créer une sous-catégorie d\'une sous-catégorie. Profondeur maximale : 2 niveaux.',
    'A category cannot be its own parent': 'Une catégorie ne peut pas être sa propre parente',
    'Cannot move a category with subcategories. Remove subcategories first.': 'Impossible de déplacer une catégorie qui a des sous-catégories. Supprimez-les d\'abord.',
    'isActive must be a boolean value': 'isActive doit être une valeur booléenne',
    'Order must be a non-negative number': 'L\'ordre doit être un nombre positif ou nul',
    'Orders must be a non-empty array of { id, order } objects': 'orders doit être un tableau non vide d\'objets { id, order }',
    // Promotion
    'Promotion not found': 'Promotion introuvable',
    'You are not authorized to create promotions for this boutique': 'Vous n\'êtes pas autorisé à créer des promotions pour cette boutique',
    'Cannot create promotions for inactive boutique': 'Impossible de créer des promotions pour une boutique inactive',
    'Maximum 5 active promotions allowed per boutique (RG34)': 'Maximum 5 promotions actives par boutique (RG34)',
    'Some products do not exist or do not belong to this boutique': 'Certains produits n\'existent pas ou n\'appartiennent pas à cette boutique',
    'You are not authorized to update this promotion': 'Vous n\'êtes pas autorisé à modifier cette promotion',
    'Cannot update ended or cancelled promotions': 'Impossible de modifier des promotions terminées ou annulées',
    'You are not authorized to cancel this promotion': 'Vous n\'êtes pas autorisé à annuler cette promotion',
    'Promotion is already ended or cancelled': 'Cette promotion est déjà terminée ou annulée',
    'You are not authorized to delete this promotion': 'Vous n\'êtes pas autorisé à supprimer cette promotion',
    'Only scheduled promotions can be deleted. Use cancel instead.': 'Seules les promotions programmées peuvent être supprimées. Utilisez annuler pour les autres.',
    'You are not authorized to view these stats': 'Vous n\'êtes pas autorisé à consulter ces statistiques',
    // Event
    'Event not found': 'Événement introuvable',
    // Order
    'Customer phone is required. Please provide it in the request or update your profile.': 'Le numéro de téléphone est requis. Indiquez-le dans la requête ou mettez à jour votre profil.',
    'Cart is empty': 'Le panier est vide',
    'Some items are no longer available': 'Certains articles ne sont plus disponibles',
    'Order not found': 'Commande introuvable',
    'Not authorized to view this order': 'Non autorisé à consulter cette commande',
    'Not authorized to cancel this order': 'Non autorisé à annuler cette commande',
    'This order cannot be cancelled': 'Cette commande ne peut pas être annulée',
    // Stock
    'Product ID is required': 'L\'identifiant du produit est requis',
    'Product not found': 'Produit introuvable',
    'You are not authorized to manage stock for this product': 'Vous n\'êtes pas autorisé à gérer le stock de ce produit',
    'You are not authorized to view this product history': 'Vous n\'êtes pas autorisé à consulter l\'historique de ce produit',
    'You are not authorized to view this boutique stock': 'Vous n\'êtes pas autorisé à consulter le stock de cette boutique',
    'You are not authorized to view this boutique movements': 'Vous n\'êtes pas autorisé à consulter les mouvements de cette boutique',
    'dateDebut and dateFin are required (YYYY-MM-DD)': 'dateDebut et dateFin sont requis (YYYY-MM-DD)',
    // Review
    'boutiqueId query parameter is required': 'Le paramètre boutiqueId est requis',
    'Review not found': 'Avis introuvable',
    'You have already left a review for this boutique. You can update it.': 'Vous avez déjà laissé un avis pour cette boutique. Vous pouvez le modifier.',
    'You can only update your own review': 'Vous ne pouvez modifier que votre propre avis',
    'Only the boutique owner or admin can respond to this review': 'Seul le propriétaire de la boutique ou l\'administrateur peut répondre à cet avis',
    'Only admin or boutique owner can hide a review': 'Seul l\'administrateur ou le propriétaire de la boutique peut masquer un avis',
    'Only admin can set reported status': 'Seul l\'administrateur peut définir le statut signalé',
    'Only author or admin can delete a review': 'Seul l\'auteur ou l\'administrateur peut supprimer un avis',
    'Only admin can republish a review': 'Seul l\'administrateur peut republier un avis',
    'You have already reported this review': 'Vous avez déjà signalé cet avis',
    'You can only delete your own review': 'Vous ne pouvez supprimer que votre propre avis',
    // Product
    'You are not authorized to add products to this boutique': 'Vous n\'êtes pas autorisé à ajouter des produits à cette boutique',
    'Cannot add products to inactive boutique': 'Impossible d\'ajouter des produits à une boutique inactive',
    'You are not authorized to update this product': 'Vous n\'êtes pas autorisé à modifier ce produit',
    'You are not authorized to delete this product': 'Vous n\'êtes pas autorisé à supprimer ce produit',
    'You are not authorized to restore this product': 'Vous n\'êtes pas autorisé à restaurer ce produit',
    'You do not have a boutique': 'Vous n\'avez pas de boutique',
    'You are not authorized to archive this product': 'Vous n\'êtes pas autorisé à archiver ce produit',
    'Product is already archived': 'Le produit est déjà archivé',
    // Stripe / Payment
    'Order ID is required': 'L\'identifiant de la commande est requis',
    'Not authorized': 'Non autorisé',
    'This order has been cancelled': 'Cette commande a été annulée',
    'This order has already been paid': 'Cette commande a déjà été payée',
    'Session ID is required': 'L\'identifiant de session est requis',
    'Stripe session not found': 'Session Stripe introuvable',
    'Payment record not found': 'Enregistrement de paiement introuvable',
    // Error handler / generic
    'Invalid token. Please log in again.': 'Token invalide. Veuillez vous reconnecter.',
    'Your token has expired. Please log in again.': 'Votre session a expiré. Veuillez vous reconnecter.',
    'Something went wrong. Please try again later.': 'Une erreur s\'est produite. Veuillez réessayer plus tard.',
  };
  if (direct[message]) return direct[message];

  // Dynamic patterns (keep variable parts)
  const lockedIn = message.match(/^Account is locked\. Try again in (\d+) minutes?\.$/);
  if (lockedIn) return `Compte verrouillé. Réessayez dans ${lockedIn[1]} minute(s).`;

  const attemptsLeftLogin = message.match(/^Invalid email or password\. (\d+) attempts remaining\.$/);
  if (attemptsLeftLogin) return `Email ou mot de passe incorrect. ${attemptsLeftLogin[1]} tentative(s) restante(s).`;

  const attemptsLeftOtp = message.match(/^Invalid or expired OTP\. (\d+) attempts remaining\.$/);
  if (attemptsLeftOtp) return `Code OTP invalide ou expiré. ${attemptsLeftOtp[1]} tentative(s) restante(s).`;

  const invalidStatus = message.match(/^Invalid status\. Must be one of:\s*(.+)$/);
  if (invalidStatus) return `Statut invalide. Valeurs possibles : ${invalidStatus[1]}`;

  const insufficientStockProduct = message.match(/^Insufficient stock for product:\s*(.+)$/);
  if (insufficientStockProduct) return `Stock insuffisant pour le produit : ${insufficientStockProduct[1]}`;

  const insufficientStock = message.match(/^Insufficient stock\. Available:\s*(\d+),\s*Requested:\s*(\d+)$/);
  if (insufficientStock) return `Stock insuffisant. Disponible : ${insufficientStock[1]}, demandé : ${insufficientStock[2]}`;

  const cannotUpdateOrder = message.match(/^Cannot update to "([^"]+)": payment not confirmed \(current: (\w+)\)$/);
  if (cannotUpdateOrder) return `Impossible de passer à « ${cannotUpdateOrder[1]} » : paiement non confirmé (actuel : ${cannotUpdateOrder[2]})`;

  const cannotDeleteCategoryBoutiques = message.match(/^Cannot delete category: (\d+) boutique\(s\) are using it\. Reassign them first\.$/);
  if (cannotDeleteCategoryBoutiques) return `Impossible de supprimer la catégorie : ${cannotDeleteCategoryBoutiques[1]} boutique(s) l'utilisent. Réaffectez-les d'abord.`;

  const cannotDeleteCategoryChildren = message.match(/^Cannot delete category: (\d+) subcategorie\(s\) exist\. Delete them first\.$/);
  if (cannotDeleteCategoryChildren) return `Impossible de supprimer la catégorie : ${cannotDeleteCategoryChildren[1]} sous-catégorie(s) existent. Supprimez-les d'abord.`;

  const routeNotFound = message.match(/^Route (.+) not found$/);
  if (routeNotFound) return `Route ${routeNotFound[1]} introuvable`;

  const invalidPath = message.match(/^Invalid (\w+): (.+)$/);
  if (invalidPath) return `${invalidPath[1]} invalide : ${invalidPath[2]}`;

  const alreadyExists = message.match(/^(.+) already exists\. Please use another value\.$/);
  if (alreadyExists) return `${alreadyExists[1]} existe déjà. Veuillez utiliser une autre valeur.`;

  const invalidInputData = message.match(/^Invalid input data: (.+)$/);
  if (invalidInputData) return `Données invalides : ${invalidInputData[1]}`;

  return message;
}

function translateErrorBodyToFr(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const out = { ...body };
  if (typeof out.message === 'string') {
    out.message = translateMessageToFr(out.message);
  }
  if (Array.isArray(out.errors)) {
    out.errors = out.errors.map((e: any) => ({
      ...e,
      message: typeof e?.message === 'string' ? translateMessageToFr(e.message) : e?.message
    }));
  }
  return out;
}

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let url = request.url;
    if (!url.startsWith('http')) {
      url = environment.apiUrl.replace(/\/$/, '') + (request.url.startsWith('/') ? request.url : '/' + request.url);
    }
    let headers = request.headers;
    const token = this.auth.getToken();
    if (token) {
      headers = headers.set('Authorization', 'Bearer ' + token);
    }
    const req = request.clone({ url, headers });
    return next.handle(req).pipe(
      catchError((err: any) => {
        // Translate API error messages to French (frontend only)
        if (err instanceof HttpErrorResponse) {
          const translated = translateErrorBodyToFr(err.error);
          return throwError(() => new HttpErrorResponse({ ...err, error: translated }));
        }
        return throwError(() => err);
      })
    );
  }
}
