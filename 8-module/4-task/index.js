import createElement from '../../assets/lib/create-element.js';
import escapeHtml from '../../assets/lib/escape-html.js';

import Modal from '../../7-module/2-task/index.js';

export default class Cart {
  cartItems = []; // [product: {...}, count: N]
  isAdd;

  constructor(cartIcon) {
    this.cartIcon = cartIcon;

    this.addEventListeners();
  }

  addProduct(product) {
    if (product) {

      let sameProduct = this.cartItems.findIndex((c) => c?.product.id === product.id);

      if (sameProduct !== -1) {
        this.cartItems[sameProduct].count++;
      } else {
        this.cartItems.push({product, count: 1});
      }

      this.onProductUpdate(this.cartItems[sameProduct]);
    }
  }

  updateProductCount(productId, amount) {
    let findProduct = this.cartItems.findIndex((c) => c?.product.id === productId);

    if (this.cartItems[findProduct]) {
      this.cartItems[findProduct].count += amount;

      if (this.cartItems[findProduct]?.count === 0) {
        this.cartItems.splice(findProduct, 1);
      }

      this.onProductUpdate(this.cartItems[findProduct]);
    }
  }

  isEmpty() {
    return !this.cartItems.length;
  }

  getTotalCount() {
    let r = 0;

    for (let cartItem of this.cartItems) {
      r += cartItem.count;
    }

    return r;
  }

  getTotalPrice() {
    let r = 0;

    for (let cartItem of this.cartItems) {
      r += cartItem.product.price * cartItem.count;
    }

    return r;
  }

  renderProduct(product, count) {
    return createElement(`
    <div class="cart-product" data-product-id="${product.id}">
      <div class="cart-product__img">
        <img src="/assets/images/products/${product.image}" alt="product">
      </div>
      <div class="cart-product__info">
        <div class="cart-product__title">${escapeHtml(product.name)}</div>
        <div class="cart-product__price-wrap">
          <div class="cart-counter">
            <button type="button" class="cart-counter__button cart-counter__button_minus">
              <img src="/assets/images/icons/square-minus-icon.svg" alt="minus">
            </button>
            <span class="cart-counter__count">${count}</span>
            <button type="button" class="cart-counter__button cart-counter__button_plus">
              <img src="/assets/images/icons/square-plus-icon.svg" alt="plus">
            </button>
          </div>
          <div class="cart-product__price">€${(product.price * count).toFixed(2)}</div>
        </div>
      </div>
    </div>`);
  }

  renderOrderForm() {
    return createElement(`<form class="cart-form">
      <h5 class="cart-form__title">Delivery</h5>
      <div class="cart-form__group cart-form__group_row">
        <input name="name" type="text" class="cart-form__input" placeholder="Name" required value="Santa Claus">
        <input name="email" type="email" class="cart-form__input" placeholder="Email" required value="john@gmail.com">
        <input name="tel" type="tel" class="cart-form__input" placeholder="Phone" required value="+1234567">
      </div>
      <div class="cart-form__group">
        <input name="address" type="text" class="cart-form__input" placeholder="Address" required value="North, Lapland, Snow Home">
      </div>
      <div class="cart-buttons">
        <div class="cart-buttons__buttons btn-group">
          <div class="cart-buttons__info">
            <span class="cart-buttons__info-text">total</span>
            <span class="cart-buttons__info-price">€${this.getTotalPrice().toFixed(2)}</span>
          </div>
          <button type="submit" class="cart-buttons__button btn-group__button button">order</button>
        </div>
      </div>
    </form>`);
  }

  renderModal() {
    this.modal = new Modal();

    this.modal.setTitle("Your order");

    let div = document.createElement('div');
    div.className = 'order-list';
    for (let cartItem of this.cartItems) {
      div.append(this.renderProduct(cartItem.product, cartItem.count));
    }
    div.append(this.renderOrderForm());

    this.modal.setBody(div);

    let counter = div.querySelectorAll('.cart-counter');

    counter.forEach((c) => {
      c.addEventListener('click', (e) => {
        let minus = e.target.closest('.cart-counter__button_minus');
        let plus = e.target.closest('.cart-counter__button_plus');

        if (minus) {
          this.isAdd = false;

          let id = minus.closest('[data-product-id]');

          let count = id.querySelector('.cart-counter__count');

          if ((+count.innerHTML - 1) === 0) {
            id.remove();
          }
          this.updateProductCount(id.dataset.productId, -1);
        } else if (plus) {
          this.isAdd = true;

          this.updateProductCount(plus.closest('[data-product-id]').dataset.productId, 1);
        } else {
          return;
        }
      });
    });

    this.modal.open();
    this.modal.createdModal.querySelector('.cart-form').addEventListener('submit', this.onSubmit);
  }

  onProductUpdate(cartItem) {
    if (this.isEmpty()) {
      this.modal.close();
    }

    if (document.body.classList.contains('is-modal-open')) {
      let modal = this.modal.createdModal;
      let modalBody = modal.querySelector('.order-list');
      let infoPrice = modalBody.querySelector(`.cart-buttons__info-price`);
      let totalPriceCount = 0;

      if (cartItem) {
        let productId = cartItem.product.id;
        let productCount = modalBody.querySelector(`[data-product-id="${productId}"] .cart-counter__count`);
        let productPrice = modalBody.querySelector(`[data-product-id="${productId}"] .cart-product__price`);

        productCount.innerHTML = cartItem.count;

        productPrice.innerHTML = `€${(cartItem.product.price * cartItem.count).toFixed(2)}`;
      }

      this.cartItems.forEach((item) => {
        totalPriceCount += item.product.price * item.count;
      });

      infoPrice.innerHTML = `€${(totalPriceCount).toFixed(2)}`;
    }

    this.cartIcon.update(this);
  }

  onSubmit = (event) => {
    event.preventDefault();
    let form = event.target;
    let button = form.querySelector('button[type="submit"]');

    button.classList.add('is-loading');

    fetch('https://httpbin.org/post', {
      method: 'POST',
      body: new FormData(form),
    }).then((response) => {
      if (response.status === 200) {
        this.modal.setTitle('Success!');
        this.modal.setBody(createElement(`
          <div class="modal__body-inner">
            <p>
              Order successful! Your order is being cooked :) <br>
              We’ll notify you about delivery time shortly.<br>
              <img src="/assets/images/delivery.gif">
            </p>
          </div>
        `));
        this.cartItems.length = 0;
      } else {
        console.error(response);
      }
    });
  };

  addEventListeners() {
    this.cartIcon.elem.onclick = () => this.renderModal();
  }
}

