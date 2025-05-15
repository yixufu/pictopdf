document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const imageList = document.getElementById('imageList');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');
    
    // 存储上传的图片
    let uploadedImages = [];
    
    // 点击上传区域触发文件输入
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 处理文件选择
    fileInput.addEventListener('change', handleFiles);
    
    // 拖拽上传功能
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFiles({ target: fileInput });
        }
    });
    
    // 生成PDF按钮点击事件
    generateBtn.addEventListener('click', generatePDF);
    
    // 清空按钮点击事件
    clearBtn.addEventListener('click', clearAll);
    
    // 处理上传的文件
    function handleFiles(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.match('image.*')) continue;
            
            const reader = new FileReader();
            
            reader.onload = (function(file) {
                return function(e) {
                    const imageData = e.target.result;
                    uploadedImages.push({
                        name: file.name,
                        data: imageData
                    });
                    
                    // 更新UI
                    updateImageList();
                    updateButtons();
                };
            })(file);
            
            reader.readAsDataURL(file);
        }
    }
    
    // 更新图片列表显示
    function updateImageList() {
        imageList.innerHTML = '';
        
        uploadedImages.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            const img = document.createElement('img');
            img.src = image.data;
            img.alt = image.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                uploadedImages.splice(index, 1);
                updateImageList();
                updateButtons();
            });
            
            imageItem.appendChild(img);
            imageItem.appendChild(removeBtn);
            imageList.appendChild(imageItem);
        });
    }
    
    // 更新按钮状态
    function updateButtons() {
        generateBtn.disabled = uploadedImages.length === 0;
        clearBtn.disabled = uploadedImages.length === 0;
    }
    
    // 生成PDF（图片连续排列版本）
    async function generatePDF() {
        if (uploadedImages.length === 0) return;
        
        status.textContent = '正在生成PDF，请稍候...';
        generateBtn.disabled = true;
        
        try {
            // 检查jsPDF是否加载
            if (!window.jspdf) {
                throw new Error('jsPDF库未正确加载');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // PDF页面尺寸 (A4)
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // 边距设置
            const margin = 10;
            const contentWidth = pageWidth - margin * 2;
            
            // 当前绘制位置
            let currentY = margin;
            
            for (let i = 0; i < uploadedImages.length; i++) {
                const imgData = uploadedImages[i].data;
                
                const img = new Image();
                img.src = imgData;
                
                await new Promise((resolve) => {
                    img.onload = function() {
                        // 计算图片显示尺寸（保持宽高比）
                        const imgRatio = img.width / img.height;
                        let displayWidth = contentWidth;
                        let displayHeight = contentWidth / imgRatio;
                        
                        // 检查当前页剩余空间是否足够
                        if (currentY + displayHeight > pageHeight - margin) {
                            // 如果当前页已经有内容，创建新页
                            if (currentY > margin) {
                                doc.addPage();
                                currentY = margin;
                            }
                            
                            // 如果图片高度仍然超过页面高度，强制缩小
                            if (displayHeight > pageHeight - margin * 2) {
                                displayHeight = pageHeight - margin * 2;
                                displayWidth = displayHeight * imgRatio;
                            }
                        }
                        
                        // 添加图片到PDF
                        doc.addImage(
                            imgData,
                            'JPEG', // 图片格式
                            margin, // x坐标
                            currentY, // y坐标
                            displayWidth, // 宽度
                            displayHeight // 高度
                        );
                        
                        // 更新下一个图片的y位置（加10mm间距）
                        currentY += displayHeight + 10;
                        
                        resolve();
                    };
                });
            }
            
            // 保存PDF
            doc.save('图片合集.pdf');
            status.textContent = 'PDF生成成功！';
        } catch (error) {
            console.error('生成PDF出错:', error);
            status.textContent = '生成PDF出错: ' + error.message;
        } finally {
            generateBtn.disabled = false;
        }
    }
    
    // 清空所有图片
    function clearAll() {
        uploadedImages = [];
        updateImageList();
        updateButtons();
        status.textContent = '';
    }
});